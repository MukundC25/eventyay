from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest
from django.core import mail as djmail
from django.urls import NoReverseMatch
from django.utils.timezone import now
from django_scopes import scope

from eventyay.base.models import Event, Organizer, Team, User
from eventyay.base.services.teams import get_team_invitation_url, send_team_invitation_email


@pytest.fixture
def organizer():
    o = Organizer.objects.create(name='Test Org', slug='test-org')
    with scope(organizer=o):
        yield o


@pytest.fixture
def user():
    return User.objects.create_user('member@example.com', 'dummy_pass')


@pytest.mark.django_db
def test_get_team_invitation_url_standard_team(organizer):
    team = Team.objects.create(organizer=organizer, name='Admin Team', teamshifts_role='')
    url = get_team_invitation_url(team)
    assert url.endswith(f'/common/organizer/test-org/team/{team.pk}')


def _create_event(organizer, slug, plugins='teamshifts', days_from_now=0):
    start = now() + timedelta(days=days_from_now)
    return Event.objects.create(
        organizer=organizer,
        name=slug,
        slug=slug,
        date_from=start,
        date_to=start + timedelta(days=1),
        plugins=plugins,
    )


@pytest.fixture
def teamshifts_installed():
    pytest.importorskip('teamshifts')


@pytest.mark.django_db
@pytest.mark.parametrize('role', ['coordinator', 'lead'])
def test_get_team_invitation_url_single_event_links_to_event_dashboard(organizer, teamshifts_installed, role):
    event = _create_event(organizer, 'conf')
    team = Team.objects.create(organizer=organizer, name='Shifts Team', teamshifts_role=role, all_events=True)
    url = get_team_invitation_url(team)
    assert url.endswith(f'/teamshifts/event/test-org/{event.slug}/')


@pytest.mark.django_db
def test_get_team_invitation_url_limited_team_links_to_its_event(organizer, teamshifts_installed):
    _create_event(organizer, 'other')
    event = _create_event(organizer, 'mine')
    team = Team.objects.create(organizer=organizer, name='Lead Team', teamshifts_role='lead', all_events=False)
    team.limit_events.add(event)
    url = get_team_invitation_url(team)
    assert url.endswith('/teamshifts/event/test-org/mine/')


@pytest.mark.django_db
def test_get_team_invitation_url_multiple_events_prefers_soonest_upcoming(organizer, teamshifts_installed):
    _create_event(organizer, 'past', days_from_now=-30)
    _create_event(organizer, 'later', days_from_now=60)
    _create_event(organizer, 'soon', days_from_now=10)
    team = Team.objects.create(organizer=organizer, name='Shifts Team', teamshifts_role='coordinator', all_events=True)
    assert get_team_invitation_url(team).endswith('/teamshifts/event/test-org/soon/')


@pytest.mark.django_db
def test_get_team_invitation_url_only_past_events_uses_latest(organizer, teamshifts_installed):
    _create_event(organizer, 'older', days_from_now=-90)
    _create_event(organizer, 'newer', days_from_now=-30)
    team = Team.objects.create(organizer=organizer, name='Shifts Team', teamshifts_role='lead', all_events=True)
    assert get_team_invitation_url(team).endswith('/teamshifts/event/test-org/newer/')


@pytest.mark.django_db
def test_get_team_invitation_url_skips_events_without_teamshifts(organizer, teamshifts_installed):
    _create_event(organizer, 'plain', plugins='', days_from_now=5)
    _create_event(organizer, 'shifts', days_from_now=20)
    team = Team.objects.create(organizer=organizer, name='Shifts Team', teamshifts_role='lead', all_events=True)
    assert get_team_invitation_url(team).endswith('/teamshifts/event/test-org/shifts/')


@pytest.mark.django_db
def test_get_team_invitation_url_no_teamshifts_event_uses_team_page(organizer):
    _create_event(organizer, 'plain', plugins='')
    team = Team.objects.create(organizer=organizer, name='Shifts Team', teamshifts_role='coordinator', all_events=True)
    assert get_team_invitation_url(team).endswith(f'/common/organizer/test-org/team/{team.pk}')


@pytest.mark.django_db
def test_get_team_invitation_url_ignores_events_outside_team_scope(organizer):
    _create_event(organizer, 'outside')
    inside = _create_event(organizer, 'inside', plugins='')
    team = Team.objects.create(organizer=organizer, name='Lead Team', teamshifts_role='lead', all_events=False)
    team.limit_events.add(inside)
    assert get_team_invitation_url(team).endswith(f'/common/organizer/test-org/team/{team.pk}')


@pytest.mark.django_db
def test_get_team_invitation_url_unavailable_plugin_route_uses_team_page(organizer):
    _create_event(organizer, 'conf')
    team = Team.objects.create(organizer=organizer, name='Lead Team', teamshifts_role='lead', all_events=True)
    with patch(
        'eventyay.base.services.teams.build_absolute_uri',
        side_effect=[NoReverseMatch('Plugin not installed'), 'http://localhost/team/'],
    ):
        assert get_team_invitation_url(team) == 'http://localhost/team/'


@pytest.mark.django_db
def test_get_team_invitation_url_standard_team_no_pk(organizer):
    mock_team = MagicMock(organizer=organizer, teamshifts_role='', pk=None)
    url = get_team_invitation_url(mock_team)
    assert url.endswith('/common/organizer/test-org/teams')


@pytest.mark.django_db
def test_send_team_invitation_email(organizer, user):
    djmail.outbox = []
    team = Team.objects.create(organizer=organizer, name='Test Team', teamshifts_role='')
    url = get_team_invitation_url(team)
    success = send_team_invitation_email(
        user=user,
        organizer_name=organizer.name,
        team_name=team.name,
        url=url,
        locale='en',
        is_registered_user=True,
    )
    assert success is True
    assert len(djmail.outbox) == 1
    assert url in djmail.outbox[0].body


@pytest.mark.django_db
def test_send_team_invitation_email_teamshifts_team(organizer, user, teamshifts_installed):
    djmail.outbox = []
    _create_event(organizer, 'conf')
    team = Team.objects.create(organizer=organizer, name='Shifts Team', teamshifts_role='coordinator', all_events=True)
    url = get_team_invitation_url(team)
    success = send_team_invitation_email(
        user=user,
        organizer_name=organizer.name,
        team_name=team.name,
        url=url,
        locale='en',
        is_registered_user=True,
    )
    assert success is True
    assert len(djmail.outbox) == 1
    assert '/teamshifts/event/test-org/conf/' in djmail.outbox[0].body
