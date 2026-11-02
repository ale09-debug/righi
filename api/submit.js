
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  try {
    const { session_id, nickname, question_id, answer } = req.body || {};

    // Controllo dei dati ricevuti
    if (
      typeof session_id !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(session_id) ||
      typeof nickname !== "string" ||
      nickname.trim().length < 1 ||
      nickname.length > 18 ||
      !Number.isInteger(question_id) ||
      !Number.isInteger(answer) ||
      answer < 0 ||
      answer > 3
    ) {
      return res.status(400).json({ error: "Dati non validi" });
    }

    // Verifica della missione attualmente aperta
    const { data: state, error: stateError } =
      await supabase
        .from("cyber_state")
        .select("current_question,event_active")
        .eq("id", 1)
        .single();

    if (stateError || !state) {
      return res.status(500).json({ error: "Stato missione non disponibile" });
    }

    if (!state.event_active || question_id !== state.current_question) {
      return res.status(403).json({
        error: "Questa missione non è attualmente disponibile"
      });
    }

    // Salvataggio della risposta
    const { error } = await supabase
      .from("cyber_answers")
      .insert({
        event_code: "LASTMESSAGE",
        session_id,
        nickname: nickname.trim(),
        question_id,
        answer
      });

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          error: "Hai già risposto a questa domanda"
        });
      }

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Risposta registrata!"
    });

  } catch (error) {
    console.error("Errore invio risposta:", error);
    return res.status(500).json({
      error: "Impossibile registrare la risposta"
    });
  }
};
