// Este ficheiro é o nosso "mini-serviço" que corre na Vercel.
// Ele usa a biblioteca 'youtube-transcript' para buscar o roteiro de forma fiável.

const { YoutubeTranscript } = require('youtube-transcript');

// Esta é a função principal que a Vercel vai executar.
module.exports = async (req, res) => {
  // Pegamos o ID do vídeo que o nosso site vai enviar (ex: /api/transcript?videoID=xxxx)
  const videoID = req.query.videoID;

  if (!videoID) {
    return res.status(400).json({ error: 'O ID do vídeo é obrigatório.' });
  }

  try {
    // Usamos a biblioteca para buscar o roteiro.
    const transcript = await YoutubeTranscript.fetchTranscript(videoID);

    // Se encontrarmos, juntamos todo o texto.
    const fullText = transcript.map(item => item.text).join(' ');

    // Enviamos a resposta de volta para o nosso site com o roteiro.
    res.status(200).json({ transcript: fullText });

  } catch (error) {
    // Se a biblioteca der um erro (ex: vídeo sem legendas), nós avisamos.
    console.error(error);
    res.status(404).json({ error: 'Não foi possível encontrar o roteiro para este vídeo. Pode ser que não tenha legendas disponíveis.' });
  }
};