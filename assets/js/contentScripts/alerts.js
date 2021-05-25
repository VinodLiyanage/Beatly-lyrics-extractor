(() => {
const alertSuccess = document.createElement('div')
alertSuccess.classList.add('success-copy','alert', 'alert-success', 'hide')
alertSuccess.setAttribute('id', 'alert-success')
alertSuccess.setAttribute('role', 'alert')
alertSuccess.innerText = 'Successfully copied to clipboard'
document.body.insertBefore(alertSuccess, document.body.firstChild)

const alertDanger = document.createElement('div')
alertDanger.setAttribute('id', 'alert-danger')
alertDanger.classList.add('success-copy','alert', 'alert-danger', 'hide')
alertDanger.setAttribute('role', 'alert')
alertDanger.innerText = 'Failed! An error occurred.'
document.body.insertBefore(alertDanger, document.body.firstChild)
})()