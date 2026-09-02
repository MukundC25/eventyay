from django.db import migrations, models


PLATFORM_PLUGINS = {
    # Payment providers — configured via event payment settings
    'eventyay_stripe': {
        'plugin_type': 'payment_provider',
        'is_required': False,
        'configured_via': 'payment_settings',
        'show_in_organizer_list': False,
        'enable_by_default': False,
    },
    'eventyay_paypal': {
        'plugin_type': 'payment_provider',
        'is_required': False,
        'configured_via': 'payment_settings',
        'show_in_organizer_list': False,
        'enable_by_default': False,
    },
    'eventyay.plugins.banktransfer': {
        'plugin_type': 'payment_provider',
        'is_required': False,
        'configured_via': 'payment_settings',
        'show_in_organizer_list': False,
        'enable_by_default': False,
    },
    'eventyay.plugins.manualpayment': {
        'plugin_type': 'payment_provider',
        'is_required': False,
        'configured_via': 'payment_settings',
        'show_in_organizer_list': False,
        'enable_by_default': False,
    },
    'eventyay_bitpay': {
        'plugin_type': 'payment_provider',
        'is_required': False,
        'configured_via': 'payment_settings',
        'show_in_organizer_list': False,
        'enable_by_default': False,
    },
    # System plugins — platform-level features
    'eventyay.plugins.reports': {
        'plugin_type': 'system',
        'is_required': False,
        'configured_via': 'platform',
        'show_in_organizer_list': False,
        'enable_by_default': False,
    },
    'eventyay.plugins.socialauth': {
        'plugin_type': 'system',
        'is_required': True,
        'configured_via': 'platform',
        'show_in_organizer_list': False,
        'enable_by_default': False,
    },
    'eventyay.plugins.checkinlists': {
        'plugin_type': 'system',
        'is_required': True,
        'configured_via': 'platform',
        'show_in_organizer_list': False,
        'enable_by_default': False,
    },
}


def populate_plugin_classification(apps, schema_editor):
    GlobalPluginConfig = apps.get_model('base', 'GlobalPluginConfig')

    for module, defaults in PLATFORM_PLUGINS.items():
        GlobalPluginConfig.objects.update_or_create(
            module=module,
            defaults=defaults,
        )

    # Mark any remaining rows (not in PLATFORM_PLUGINS) as external
    GlobalPluginConfig.objects.exclude(
        module__in=PLATFORM_PLUGINS.keys()
    ).update(plugin_type='external')


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0067_user_profile_picture_user_profile_picture_thumbnail_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='globalpluginconfig',
            name='plugin_type',
            field=models.CharField(
                choices=[
                    ('payment_provider', 'Payment provider'),
                    ('system', 'System plugin'),
                    ('external', 'External plugin'),
                ],
                default='external',
                help_text='Classification of the plugin.',
                max_length=32,
                verbose_name='Plugin type',
            ),
        ),
        migrations.AddField(
            model_name='globalpluginconfig',
            name='is_required',
            field=models.BooleanField(
                default=False,
                help_text='Required plugins cannot be deactivated.',
                verbose_name='Required',
            ),
        ),
        migrations.AddField(
            model_name='globalpluginconfig',
            name='configured_via',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Describes where this plugin is configured (e.g. payment_settings, platform).',
                max_length=64,
                verbose_name='Configured via',
            ),
        ),
        migrations.RunPython(
            populate_plugin_classification,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
