
const crypto = require("crypto");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Metodo non consentito"
    });
  }

  try {
    const { password } = req.body || {};

    const expected = process.env.TEACHER_PASSWORD;

    if (
      typeof password !== "string" ||
      typeof expected !== "string" ||
      !expected
    ) {
      return res.status(401).json({
        error: "Accesso non autorizzato"
      });
    }

    const supplied = Buffer.from(password);
    const correct = Buffer.from(expected);

    if (
      supplied.length !== correct.length ||
      !crypto.timingSafeEqual(supplied, correct)
    ) {
      return res.status(401).json({
        error: "Password non corretta"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Accesso docente verificato"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Errore di autenticazione"
    });
  }
};
