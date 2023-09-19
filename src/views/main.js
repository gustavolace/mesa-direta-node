async function getUser() {
  tbody.innerHTML = "";
  await fetch("http://localhost:3333/select")
    .then((res) => res.json())
    .then((dados) => {
      dados.forEach((user) => {
        tbody.innerHTML += `
                  <tr>
                      <td>${user.name}</td>
                      <td>${user.email}</td>
                      <td><button id="abirModal2" class="atualizar" onclick='modal2(this)' */>Editar</>
                      <td><button>Excluir</>
                      </tr>
                  `;
      });
    })
    .catch((error) => console.log(error));
}

async function postUser() {
  const clientInformations = [
    document.getElementById("name").value,
    document.getElementById("email").value,
  ];

  fetch("http://localhost:3333/receber", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientInformations }),
  });

  console.log(clientInformations)
}
getUser();


document.getElementById("abrirModal").addEventListener("click", () => {
  document.getElementById("meuModal").style.display = "block";
});

document.querySelector(".fechar").addEventListener("click", () => {
  document.getElementById("meuModal").style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target == document.getElementById("meuModal")) {
    document.getElementById("meuModal").style.display = "none";
  }
});

let lastEmail
let lastName

function modal2(button) {
  document.getElementById('meuModal2').style.display = "block"
  document.querySelector(".fechar2").addEventListener("click", () => {
  document.getElementById("meuModal2").style.display = "none"})
  window.addEventListener("click", (event) => {
    if (event.target == document.getElementById("meuModal2")) {
      document.getElementById("meuModal2").style.display = "none"}})

        let row = button.parentNode.parentNode;
        lastName = row.getElementsByTagName("td")[0].innerText;
        lastEmail = row.getElementsByTagName("td")[1].innerText;
      }

function updateUser() {
    const clientUpdateInformations = [
      lastName,
      lastEmail,
      document.getElementById("upName").value,
      document.getElementById("upEmail").value,
    ];
      fetch("http://localhost:3333/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientUpdateInformations }),
      });
      console.log(clientUpdateInformations);
}
