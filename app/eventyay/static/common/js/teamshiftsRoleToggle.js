document.querySelectorAll('[data-teamshifts-role-value]').forEach(function (hiddenInput) {
  const fieldset = hiddenInput.closest('fieldset');
  if (!fieldset) {
    return;
  }

  const checkboxes = fieldset.querySelectorAll('[data-teamshifts-role]');
  const leadOptions = fieldset.querySelector('.teamshifts-lead-options');

  function syncState() {
    var activeRole = '';
    checkboxes.forEach(function (cb) {
      if (cb.checked) {
        activeRole = cb.dataset.teamshiftsRole;
      }
    });
    hiddenInput.value = activeRole;
    if (leadOptions) {
      leadOptions.hidden = activeRole !== 'lead';
    }
  }

  checkboxes.forEach(function (cb) {
    cb.addEventListener('change', function () {
      if (cb.checked) {
        checkboxes.forEach(function (other) {
          if (other !== cb) {
            other.checked = false;
          }
        });
      }
      syncState();
    });
  });

  syncState();
});

document.querySelectorAll('.teamshifts-roles-selector[data-radio-name]').forEach(function (selector) {
  var radioName = selector.dataset.radioName;
  var container = selector.closest('.teamshifts-lead-options') || selector.closest('fieldset');
  if (!container || !radioName) {
    return;
  }

  function toggle() {
    var selectedRolesOnly = container.querySelector(
      'input[name="' + radioName + '"][value="False"]:checked',
    );
    selector.hidden = !selectedRolesOnly;
  }

  container.querySelectorAll('input[name="' + radioName + '"]').forEach(function (radio) {
    radio.addEventListener('change', toggle);
  });

  toggle();
});
