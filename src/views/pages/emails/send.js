function toggleOptions() {
  const optionsList = document.getElementById("optionsList");
  optionsList.style.display =
    optionsList.style.display === "none" ? "block" : "none";
}

let filepreview;
 let to = [];
async function toggleOption(option) {
  event.stopPropagation();
  option.classList.toggle("selected");
  let promises = Array.from(document.getElementsByClassName("selected")).map(
    (option) =>
      fetch("/select")
        .then((response) => response.json())
        .then((dados) => {
          const userEmail = dados.find(
            (user) => user.name === option.innerText
          )?.email;
          const groupEmail = dados
            /*    .forEach((element => {
        if(element.group_id === option.innerText) {
          groupEmail = element.email
          console.log(groupEmail)
        }
       })) */
            .filter((user) => user.group_id === option.innerText)
            .map((user) => user.email);

          return [userEmail, groupEmail];
        })
  );

  
    let emails = await Promise.all(promises);
    to = []
    for (const item of emails) {
      if (item[0] && item[0].includes("@")) {
        to.push(item[0]);
      }
      if (Array.isArray(item[1])) {
        for (const email of item[1]) {
          if (email.includes("@")) {
            to.push(email);
          }
        }
      }
    }

    if (to.length > 0) {
      document.querySelector(".custom-selector").innerText = to.join(", ");
    } else {
      document.querySelector(".custom-selector").innerText = "Selecione Opções";
    }

    document.getElementById("preview").innerHTML = "";

    to.forEach((element) => {
      document.getElementById("preview").innerHTML += `
          <div class="preview" id="dPreview" style="border: 1px groove #000; padding: 10px; width: 90%">
         <div>
              <label for="">Preview</label>
            </div>
            <div>
              <label for="">Para</label>
              <input type="text" id="" disabled value="${element}">
            </div>
            <div>
              <label for="">Assunto</label>
              <input type="text" value="${subject.value || ""}" disabled>
            </div>
            <div><label for="">Conteudo</label>
            <div style="word-wrap: break-word; border-style: groove; width: 90%; max-width: 600px;" disabled><p>${
              document.querySelector(".textarea").value
            }</p></div>
          </div>
          <div>
            <label for="">Arquivos</label>
      <span>
       ${filepreview !== undefined ? filepreview : ""}
      </span>
          </div>  
          </div>`;
    });

}

document.addEventListener("click", function (event) {
  const optionsList = document.getElementById("optionsList");
  const customSelector = document.querySelector(".custom-selector");

  if (
    event.target !== optionsList &&
    event.target !== customSelector &&
    !customSelector.contains(event.target)
  ) {
    optionsList.style.display = "none";
  }
});

//preview
let text = document.querySelector(".textarea");
let subject = document.forms[0].elements[2];
text.oninput = subject.oninput = () => {
  document.querySelectorAll(".preview").forEach((element) => {
    let email = element.children[1].children[1].value;

    fetch("/select")
      .then((res) => res.json())
      .then((dados) => {
        dados.forEach((user) => {
          if (email === user.email) {
            element.children[2].children[1].value = subject.value.replace(
              "$client",
              user.name
            );
            element.children[3].children[1].children[0].innerHTML = text.value
              .replace("$client", user.name)
              .replace(/\n/g, "<br>");
          }
        });
      });
    element.children[3].children[1].children[0].innerHTML = text.value.replace(
      /\n/g,
      "<br>"
    );
    element.children[2].children[1].value = subject.value;
  });
};

//files
let formData = new FormData();

document.getElementById("files").addEventListener("change", () => {
  let file = document.getElementById("files").files[0];
  formData.append("file", file);
  document.getElementById(
    "fileList"
  ).innerHTML += ` Arquivo selecionado: ${file.name} <span class="close">&times<span><br>`;
  document.querySelectorAll(".preview").forEach((element) => {
    filepreview =
      element.children[4].children[1].innerHTML += `${file.name}(${file.size}kb) <br>`;
  });
  document.querySelectorAll(".close").forEach((element) => {
    element.addEventListener("click", () => {
      document.getElementById("fileList").innerHTML = "";
      formData = new FormData();
      filepreview = "";
      document.querySelectorAll(".preview").forEach((element) => {
        element.children[4].children[1].innerHTML = "";
      });
    });
  });
});
//

function filterOptions() {
  const inputValue = document.getElementById("search").value.toLowerCase();
  const options = document.querySelectorAll(".option");
  options.forEach((option) => {
    const optionText = option.innerText.toLowerCase();
    if (optionText.includes(inputValue)) {
      if (!option.hasAttribute("hidden")) {
        option.style.display = "block";
      }
    } else {
      option.style.display = "none";
    }
  });
}

async function sendMail() {
  event.preventDefault();
  to.forEach((element) => {
    fetch("/select")
      .then((res) => res.json())
      .then((dados) => {
        dados.forEach((user) => {
          if (element === user.email) {
            const emailBody = text.value
              .replace("$client", user.name)
              .replace(/\n/g, "<br>");

            const { from, date } = document.forms[0].elements;
            const emailInformations = {
              from: from.value,
              element,
              subject: subject.value.replace("$client", user.name),
              html: emailBody,
              date: date.value,
            };
            fetch("/upload", {
              method: "POST",
              body: formData,
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.uploaded) {
                  fetch("/sendmail", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ emailInformations }),
                  })
                    .then((response) => response.json())
                    .then((data) => {
                      if (data.sended) {
                        alert(
                          `Email enviado com sucesso para ${emailInformations.element}`
                        );
                      } else {
                        alert(
                          `Houve um erro ao enviar o email para ${emailInformations.element}`
                        );
                      }
                    })
                    .catch((error) => {
                      console.error("Erro na solicitaçao", error);
                    });
                } else {
                  alert("Erro ao enviar o arquivo");
                }
              });
          }
        });
      });
  });
}
async function getUser() {
  let ul = document.querySelector("ul");
  const addedIds = new Set();

  await fetch("/select")
    .then((res) => res.json())
    .then((dados) => {
      dados.forEach((user) => {
        if (user.group_id === null) {
          ul.innerHTML += `
        <li class="option" onclick="toggleOption(this)">${user.name}</li>
        `;
        }
        if (user.group_id !== null && !addedIds.has(user.group_id)) {
          ul.innerHTML += `<li class="option" onclick="toggleOption(this)">${user.group_id}</li>`;
          addedIds.add(user.group_id);
        }
      });
    });
}
getUser();

fetch("/header")
  .then((response) => response.text())
  .then((data) => (document.getElementById("header").innerHTML = data));

fetch("/mailUser")
  .then((res) => res.json())
  .then((data) => {
    const mailUser = data.mailUser;
    document.getElementById("from").value = mailUser;
  });
