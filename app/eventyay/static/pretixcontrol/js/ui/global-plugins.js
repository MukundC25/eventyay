document.addEventListener('DOMContentLoaded', function () {
  var tables = document.querySelectorAll('[data-global-plugins-table]')
  if (!tables.length) return

  tables.forEach(function (table) {
    var rows = table.querySelectorAll('[data-plugin-row]')

    rows.forEach(function (row) {
      var pluginType = row.getAttribute('data-plugin-type')
      if (pluginType === 'platform') return

      var active = row.querySelector('[data-col="active"]')
      if (!active) return

      var deps = row.querySelectorAll(
        '[data-col="enable_by_default"], [data-col="show_in_organizer_list"]'
      )

      function syncRow() {
        deps.forEach(function (dep) {
          dep.disabled = !active.checked
          if (!active.checked) dep.checked = false
        })
      }

      syncRow()
      active.addEventListener('change', syncRow)
    })
  })
})
