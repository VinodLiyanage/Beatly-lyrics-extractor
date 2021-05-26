(() => {
  const alertSuccess = document.createElement("div");
  const alertDanger = document.createElement("div");

  for (let elm of [alertSuccess, alertDanger]) {
    if (!(elm instanceof HTMLElement)) continue;

    elm.style.position = "fixed";
    elm.style.top = "0";
    elm.style.left = "50%";
    elm.style.transform = "translate(-50%, 0)";
    elm.style.zIndex = "9999999";
  }
  alertSuccess.classList.add("alert", "alert-success", "hide");
  alertSuccess.setAttribute("id", "alert-success");
  alertSuccess.setAttribute("role", "alert");
  alertSuccess.innerText = "Successfully copied to clipboard";
  document.body.insertBefore(alertSuccess, document.body.firstChild);

  alertDanger.setAttribute("id", "alert-danger");
  alertDanger.classList.add("alert", "alert-danger", "hide");
  alertDanger.setAttribute("role", "alert");
  alertDanger.innerText = "Failed! An error occurred.";
  document.body.insertBefore(alertDanger, document.body.firstChild);
})();
