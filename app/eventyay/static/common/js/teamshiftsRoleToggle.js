/**
 * TeamShifts role toggle for Team permissions.
 *
 * Shows/hides the Team Lead options (role access + hide emails) based on
 * which TeamShifts role radio is selected. Also toggles the role selector
 * visibility based on "All roles" vs "Selected roles only".
 */

// Toggle Team Lead options visibility based on role selection
document.querySelectorAll('.teamshifts-lead-options[data-role-name]').forEach(function (optionsDiv) {
  const roleName = optionsDiv.dataset.roleName;
  const fieldset = optionsDiv.closest('fieldset');
  if (!fieldset || !roleName) {
    return;
  }

  function toggleLeadOptions() {
    const selectedRadio = fieldset.querySelector(
      'input[name="' + roleName + '"]:checked',
    );
    const isLead = selectedRadio && selectedRadio.value === 'lead';
    optionsDiv.hidden = !isLead;
  }

  fieldset.querySelectorAll('input[name="' + roleName + '"]').forEach(function (radio) {
    radio.addEventListener('change', toggleLeadOptions);
  });

  toggleLeadOptions();
});

// Toggle roles selector visibility based on "All roles" vs "Selected roles only"
document.querySelectorAll('.teamshifts-roles-selector[data-radio-name]').forEach(function (selector) {
  const radioName = selector.dataset.radioName;
  const container = selector.closest('.teamshifts-lead-options') || selector.closest('fieldset');
  if (!container || !radioName) {
    return;
  }

  function toggle() {
    const selectedRolesOnly = container.querySelector(
      'input[name="' + radioName + '"][value="False"]:checked',
    );
    selector.hidden = !selectedRolesOnly;
  }

  container.querySelectorAll('input[name="' + radioName + '"]').forEach(function (radio) {
    radio.addEventListener('change', toggle);
  });

  toggle();
});
