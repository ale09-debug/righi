
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const password = req.headers["x-teacher-password"];

  if (
    !password ||
    password !== process.env.TEACHER_PASSWORD
  ) {
    return res.status(401).json({ error: "Accesso docente non autorizzato" });
  }

  try {
    const { data: state, error: stateError } =
      await supabase
        .from("cyber_state")
        .select("*")
        .eq("id", 1)
        .single();

    if (stateError) throw stateError;

    const { data, error } = await supabase
      .from("cyber_answers")
      .select("question_id,answer")
      .eq("event_code", "LASTMESSAGE");

    if (error) throw error;

    const correctAnswers = [1, 2, 2, 1, 0];

    const questions = [1, 2, 3, 4, 5].map(id => {
      const answers = data.filter(x => x.question_id === id);
      const total = answers.length;

      return {
        question: id,
        total,
        correct: correctAnswers[id - 1],
        percentages: [0, 1, 2, 3].map(option => {
          const count = answers.filter(x => x.answer === option).length;

          return {
            option,
            count,
            percentage: total
              ? Math.round(count / total * 100)
              : 0
          };
        })
      };
    });

    return res.status(200).json({
      participants: new Set(
        data.map(x => x.question_id + ":" + x.answer)
      ).size,
      current_question: state.current_question,
      event_active: state.event_active,
      questions
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Errore nel caricamento dei risultati"
    });
  }
};
