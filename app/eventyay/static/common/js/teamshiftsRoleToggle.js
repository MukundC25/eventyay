document.querySelectorAll('.teamshifts-roles-selector[data-radio-name]').forEach(function (selector) {
  const radioName = selector.dataset.radioName;
  const fieldset = selector.closest('fieldset');
  if (!fieldset || !radioName) {
    return;
  }

  function toggle() {
    const selectedRolesOnly = fieldset.querySelector(
      'input[name="' + radioName + '"][value="False"]:checked',
    );
    selector.style.display = selectedRolesOnly ? '' : 'none';
  }

  fieldset.querySelectorAll('input[name="' + radioName + '"]').forEach(function (radio) {
    radio.addEventListener('change', toggle);
  });

  toggle();
});
