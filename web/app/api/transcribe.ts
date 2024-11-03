import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable();
    const [fields, files] = await form.parse(req);
    const audioFile = files.audio?.[0];

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // AssemblyAI configuration
    const headers = {
      authorization: process.env.ASSEMBLY_AI_API_KEY,
      'content-type': 'application/json',
    };

    // Upload the audio file
    const uploadResponse = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      fs.createReadStream(audioFile.filepath),
      { headers }
    );

    // Start transcription
    const transcribeResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadResponse.data.upload_url,
      },
      { headers }
    );

    // Poll for transcription completion
    const transcriptId = transcribeResponse.data.id;
    let transcript;
    while (true) {
      const pollResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        { headers }
      );
      
      if (pollResponse.data.status === 'completed') {
        transcript = pollResponse.data;
        break;
      } else if (pollResponse.data.status === 'error') {
        throw new Error('Transcription failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    res.status(200).json({ text: transcript.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Transcription failed' });
  }
}
