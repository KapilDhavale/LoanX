async function deposit() {

  const amount = document.getElementById("depositAmount").value;

  if (!amount) {
    alert("Enter amount");
    return;
  }

  const res = await fetch("http://localhost:4000/deposit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: parseInt(amount)
    })
  });

  const data = await res.json();

  document.getElementById("message").innerText =
    data.message;
}
