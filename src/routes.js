require("dotenv").config();
const { Router } = require("express");
const db = require("./services/mysql");
const {
  allUser,
  insertUser,
  updateUser,
  deleteUser,
  insertXlsxUser,
  insertGroupName,
  groupSelect,
  deleteGroupQuerry,
  insertEmail,
  allEmail,
} = require("./helpers/handleMysql");
const routes = Router();
const smtp = require("./services/smtp");
const path = require("path");
const multer = require("multer");
const uploadArchive = require("./helpers/xls");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const cron = require("node-cron");
const cronDate = require("./services/crom");
const express = require("express");
const auth = require("./middlewares/auth");

routes.get("/select", async (req, res) => {
  try {
    res.json((await db.dbPromise.query(allUser))[0]);
  } catch (e) {
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

routes.get("/getEmail", async (req, res) => {
  try {
    res.json((await db.dbPromise.query(allEmail))[0]);
  } catch (e) {
    res.status(500).json({ message: "Erro interno" });
  }
});

routes.get("/groupSelect", async (req, res) => {
  try {
    res.json((await db.dbPromise.query(groupSelect, ["ca"]))[0]);
  } catch (e) {
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

routes.post("/receber", async (req, res) => {
  const clientInformations = req.body.clientInformations;
  console.log("Informação recebida " + clientInformations);

  try {
    await db.dbPromise.query(insertUser, [
      clientInformations[0],
      clientInformations[1],
      clientInformations[2],
      clientInformations[3],
    ]);
  } catch (e) {
    console.error("Erro interno do servidor:", e);
    if (e.code === "ER_DUP_ENTRY") {
      res.json({ sended: true });
    } else {
      res.json({ sended: false });
    }
  }
});

routes.post("/update", async (req, res) => {
  const clientUpdateInformations = req.body.clientUpdateInformations;
  console.log("Informação recebida " + clientUpdateInformations);

  try {
    await db.dbPromise.query(updateUser, [
      clientUpdateInformations[2],
      clientUpdateInformations[3],
      clientUpdateInformations[4],
      clientUpdateInformations[5],
      clientUpdateInformations[0],
      clientUpdateInformations[1],
    ]);
  } catch (e) {
    console.error("Erro interno do servidor:", e);
    res.status(500).send("Erro interno do servidor");
  }
});

routes.post("/delete", async (req, res) => {
  const clientDeleteInformations = req.body.clientDeleteInformations;
  console.log("Informação recebida " + clientDeleteInformations);

  try {
    await db.dbPromise.query(deleteUser, [
      clientDeleteInformations[0],
      clientDeleteInformations[1],
    ]);
  } catch (e) {
    console.error("Erro interno do servidor:", e);
    res.status(500).send("Erro interno do servidor");
  }
});

routes.post("/deleteGroup", async (req, res) => {
  const deleteGroup = req.body.deleteGroup;
  console.log("Informação recebida " + deleteGroup);
  try {
    await db.dbPromise.query(deleteGroupQuerry, deleteGroup);
    res.json({ sended: true });
  } catch (e) {
    console.error("Erro interno do servidor:", e);
  }
});

routes.post("/sendmail", async (req, res) => {
  const emailInformations = req.body.emailInformations;

  let mailOptions = {
    from: emailInformations.from,
    to: emailInformations.element,
    subject: emailInformations.subject,
    html: emailInformations.html,
    attachments: global.files,
  };
  console.log (JSON.stringify(mailOptions));
  
  if (isNaN(Date.parse(emailInformations.date))) {
    smtp.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.json({ sended: false });
        unlink(global.files);
        db.dbPromise.query(insertEmail, [
          "Não enviado",
          mailOptions.from,
          mailOptions.to,
          mailOptions.subject,
          mailOptions.html,
        ]);
      } else {
        console.log("E-mail enviado: " + info.response);
        res.json({ sended: true });
        unlink(global.files);

        db.dbPromise.query(insertEmail, [
          "Enviado",
          mailOptions.from,
          mailOptions.to,
          mailOptions.subject,
          mailOptions.html,
        ]);
      }
    });
  } else {
    cron.schedule(cronDate(emailInformations.date), () => {
      smtp.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.json({ sended: false });
          unlink(global.files);
          db.dbPromise.query(insertEmail, [
            "Não enviado",
            mailOptions.from,
            mailOptions.to,
            mailOptions.subject,
            mailOptions.html,
          ]);
        } else {
          console.log("E-mail enviado: " + info.response);
          res.json({ sended: true });
          unlink(global.files);
          db.dbPromise.query(insertEmail, [
            "Enviado",
            mailOptions.from,
            mailOptions.to,
            mailOptions.subject,
            mailOptions.html,
          ]);
        }
      });
    });
  }
  function unlink(files) {
    files.forEach((element) => {
      fs.unlink(element.path, (err) => {
        if (err) {
          console.error("Erro ao excluir:", err);
          return;
        }
        console.log("Arquivo excluido");
      });
    });
  }
});

global.files = [];
routes.post("/upload", upload.array("file"), async (req, res) => {
  try {
    global.files = [];
    const files = req.files;
    console.log(files);
    files.forEach((file) => {
      global.files.push({
        filename: file.originalname,
        path: file.path,
      });
    });
    console.log(global.files);
    res.json({ uploaded: true });
  } catch (error) {
    console.error("Erro interno do servidor:", error);
    res.json({ uploaded: false });
  }
});

routes.get("/header", (req, res) => {
  res.sendFile(path.join(__dirname, "/views/header.html"));
});

const mailUser = process.env.MAIL_RECIPIENT;
routes.get("/mailUser", (req, res) => {
  res.json({ mailUser });
});

routes.post("/upload-xlsx", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    console.log("arquivo recebido", file);

    const values = uploadArchive(file.path);

    await db.dbPromise.query(insertXlsxUser + values);

    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Erro ao excluir o arquivo:", err);
      } else {
        console.log("Arquivo excluído com sucesso");
      }
    });

    res.json({ sended: true });
  } catch (error) {
    console.error("Erro interno do servidor:", error);
    const file = req.file;
    fs.unlink(file.path, (err) => {});
    res.json({ sended: false, error: error.sqlMessage });
  }
});

routes.use(express.urlencoded({ extended: true }));

routes.post("/auth", auth, async (req, res) => {
  res.redirect("/start");
});

routes.use(
  "/start",
  auth,
  express.static(path.join(__dirname, "views/pages/start"))
);
routes.use(
  "/emails",
  auth,
  express.static(path.join(__dirname, "views/pages/emails"))
);
routes.use("/login", express.static(path.join(__dirname, "views/pages/login")));
routes.use(
  "/report",
  express.static(path.join(__dirname, "views/pages/report"))
);

routes.get("*", (req, res) => {
  res.redirect("/start");
});

module.exports = routes;
