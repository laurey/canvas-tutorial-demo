var EventUtil = {
  addHandler: function (el, type, handler) {
    if (!el) {
      throw Error("el does NOT exist!");
    }

    if (el.addEventListener) {
      el.addEventListener(type, handler, false);
    } else if (el.attachEvent) {
      el.attachEvent("on" + type, handler);
    } else {
      el["on" + type] = handler;
    }
  },
  removeHandler: function (el, type, handler) {
    if (el.removeEventListener) {
      el.removeEventListener(type, handler, false);
    } else if (el.detachEvent) {
      el.detachEvent("on" + type, handler);
    } else {
      el["on" + type] = null;
    }
  },
  getEvent: function (evt) {
    return evt ? evt : window.event;
  },
  getTarget: function (evt) {
    return evt.target || evt.srcElement;
  },
  preventDefault: function (evt) {
    if (evt.preventDefault) {
      evt.preventDefault();
    } else {
      evt.returnValue = false;
    }
  },
  stopPropagation: function (evt) {
    if (evt.stopPropagation) {
      evt.stopPropagation();
    } else {
      evt.cancelBubble = true;
    }
  },
  getRelatedTarget: function (evt) {
    if (evt.relatedTarget) {
      return evt.relatedTarget;
    } else if (evt.toElement) {
      return evt.toElement;
    } else if (evt.fromElement) {
      return evt.fromElement;
    } else {
      return null;
    }
  },
  getButton: function (evt) {
    if (document.implementation.hasFeature("MouseEvents", "2.0")) {
      return evt.button;
    } else {
      switch (evt.button) {
        case 0:
        case 1:
        case 3:
        case 5:
        case 7:
          return 0;
        case 2:
        case 6:
          return 2;
        case 4:
          return 1;
      }
    }
  },
  getCharCode: function (evt) {
    if (typeof evt.charCode == "number") {
      return evt.charCode;
    } else {
      return evt.keyCode;
    }
  },
};
