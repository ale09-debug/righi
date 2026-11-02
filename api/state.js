
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const password = req.headers["x-teacher-password"];

  if (
    !password ||
    password !== process.env.TEACHER_PASSWORD
  ) {
    return res.status(401).json({
      error: "Password docente errata"
    });
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("cyber_state")
        .select("*")
        .eq("id", 1)
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { action } = req.body || {};

      const { data: state, error: readError } =
        await supabase
          .from("cyber_state")
          .select("*")
          .eq("id", 1)
          .single();

      if (readError) throw readError;

      let update = {};

      if (action === "start") {
        update = {
          current_question: 1,
          event_active: true
        };
      } else if (action === "pause") {
        update = { event_active: false };
      } else if (action === "next") {
        if (state.current_question >= 5) {
          return res.status(400).json({
            error: "Hai già raggiunto l'ultima missione"
          });
        }

        update = {
          current_question: state.current_question + 1,
          event_active: true
        };
      } else if (action === "restart") {
        const { error: deleteError } = await supabase
          .from("cyber_answers")
          .delete()
          .eq("event_code", "LASTMESSAGE");

        if (deleteError) throw deleteError;

        update = {
          current_question: 1,
          event_active: false
        };
      } else {
        return res.status(400).json({
          error: "Comando non riconosciuto"
        });
      }

      const { data, error } = await supabase
        .from("cyber_state")
        .update({
          ...update,
          updated_at: new Date().toISOString()
        })
        .eq("id", 1)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json(data);
    }

    return res.status(405).json({
      error: "Metodo non consentito"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Errore nella gestione della missione"
    });
  }
};
