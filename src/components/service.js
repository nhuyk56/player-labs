import Axios from 'axios'
const getAuth = () => Axios.get('http://localhost:8081/token').then(({ data }) => data)
const getChunks = (content, tokenS1) => Axios.post('https://learningtools.onenote.com/learningtoolsapi/cognitive/v2.0/GetContentModelForReader', {
  "data": {
    "chunks": [{ content }],
  },
  "options": {
    "EnableLanguageDetection": true,
    "ReturnText": true,
    "ReturnWordSegments": true,
    "ReturnSentenceSegments": true,
    "ReturnPartsOfSpeech": false,
    "ReturnPronunciation": false,
    "ReturnVowelPhonemes": false,
    "ReturnSyllables": true,
    "ReturnLanguages": true,
    "ReturnReadabilityScore": true,
    "ReturnPictureDictionaryEntries": false,
    "UseDeclaredSegments": false,
    "ReturnPhrases": false,
    "PreserveStructure": false,
    "EnableSegmentation": true
  }
}, {
  headers: {
    "Authorization": `CogSvcsAccessToken ${tokenS1}`
  }
}).then(({ data }) => data)
const getChunkAudio = (chunk, tokenS2) => Axios.post('https://learningtools.onenote.com/learningtoolsapi/v2.0/GetSpeech', {
  "data": {
    "sentenceModels": [chunk]
  },
  "options": {
    "preferredVoice": "Male",
    "extractWordMarkers": true,
    "encoding": "Mp3",
    "clientLabel": "ReadAloudFirstPrefetch",
    "useBrowserSpecifiedDialect": true
  }
}, {
  headers: { "Authorization": `MS-SessionToken ${tokenS2}` }
}).then(({ data }) => data)
  .then(data => data?.data?.sb?.[0]?.ad?.replace('data:audio/mpeg;base64,', ''))

const getSources = () => Axios.get('https://cp.nhungtruyen.com/api/books/17039/newest-chapters').then(({ data }) => data._data)
const getChapters = (params) => Axios.get('https://cp.nhungtruyen.com/api/chapters', { params }).then(({ data }) => data._data)
const getContent = (params) => Axios.get(`https://cp.nhungtruyen.com/api/chapters/${new Date().getTime()}`, { params }).then(({ data }) => data._data)

export {
  getAuth,
  getChunks,
  getChunkAudio,
  getContent,
  getSources,
  getChapters
}
