// TODO: Drag reordering

(() => {
  'use strict';

  Object.assign(HTMLCollection.prototype, {
    forEach (event) {
      Array.prototype.forEach.call(this, (element) => event(element));
    }
  });

  const pointEnabledInputs = document.getElementsByClassName('point-enabled');
  const pointDeleteButtons = document.getElementsByClassName('point-delete');
  const walkPointsRows = document.querySelectorAll('table.walk-points tr');

  walkPointsRows.forEach((pointRow) => {
    pointRow.pointLatitude = pointRow.getElementsByClassName('point-latitude')[0];
    pointRow.pointLongitude = pointRow.getElementsByClassName('point-longitude')[0];
    pointRow.pointEnabled = pointRow.getElementsByClassName('point-enabled')[0];
    pointRow.enable = function () { setEnableValue(this.pointEnabled, 1); };
    pointRow.disable = function () {
      setEnableValue(this.pointEnabled, 0);
      this.setLatLng('', '');
    };
    pointRow.getLatLng = function () { return [this.pointLatitude.value, this.pointLongitude.value]; };
    pointRow.setLatLng = function (lat, lng) {
      this.pointLatitude.value = lat;
      this.pointLongitude.value = lng;
    };
    // TODO: function to add point at first available spot (or end if free and reorder; error if all 50 used)
  });

  pointEnabledInputs.forEach((enableCtrl) => {
    togglePointDisplay(enableCtrl);
    enableCtrl.addEventListener('change', (event) => {
      togglePointDisplay(event.target);
    });
  });

  pointDeleteButtons.forEach((deleteBtn) => {
    deleteBtn.addEventListener('click', (event) => {
      deleteBtn.parentElement.parentElement.disable();
      reorder();
    });
  });

  function togglePointDisplay (enableCtrl) {
    const pointRow = enableCtrl.parentElement.parentElement;
    if (enableCtrl.value == 1) {
      pointRow.pointLatitude.setAttribute('required', '');
      pointRow.pointLongitude.setAttribute('required', '');
      pointRow.classList.remove('d-none');
    } else {
      pointRow.pointLatitude.removeAttribute('required');
      pointRow.pointLongitude.removeAttribute('required');
      pointRow.classList.add('d-none');
    }
  }

  addEventListener('keydown', (event) => {
    if (event.code == 'ControlLeft') {
      for (let i = 0; i < 10; i++) {
        const enableCtrl = document.querySelector('#points-' + i + ' .point-enabled');
        setEnableValue(enableCtrl, 1);
      };
    }
  });

  function reorder () {
    const coordinates = [];

    walkPointsRows.forEach((pointRow) => {
      if (pointRow.pointEnabled.value == 1) {
        const latLng = pointRow.getLatLng();
        if (latLng[0] != '' || latLng[1] != '') {
          pointRow.setLatLng('', '');
          coordinates.push(latLng);
        }
      }
    });

    console.log(coordinates);

    for (let i = 0; i < coordinates.length; i++) {
      walkPointsRows[i].setLatLng(coordinates[i][0], coordinates[i][1]);
      walkPointsRows[i].enable();
    };

    for (let i = coordinates.length; i < 50; i++) {
      walkPointsRows[i].disable();
    }
  }

  function setEnableValue (enableCtrl, value) {
    enableCtrl.value = value;
    enableCtrl.dispatchEvent(new Event('change'));
  }

  document.querySelectorAll('.needs-validation').forEach(form => {
    form.addEventListener('submit', event => {
      let enabledCount = 0;
      walkPointsRows.forEach((pointRow) => {
        enabledCount += (pointRow.pointEnabled.value * 1);
      });
      if (enabledCount <= 2) {
        // TODO: show message
        event.preventDefault();
        event.stopPropagation();
      }
    });
  });
})();
