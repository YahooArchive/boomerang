if (window.XMLHttpRequest) {
  var xhr = new window.XMLHttpRequest();

  xhr.open("GET", "//test:test@" + window.location.hostname + ":" + window.location.port + "/", true);

  if (xhr.addEventListener) {
    xhr.addEventListener("load", function errorFunction() {
      // will throw an error
      a.foo = false;
    });
  }

  xhr.send(null);
}
