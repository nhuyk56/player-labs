import Axios from 'axios'
const getContent = () => Axios.get('https://cp.nhungtruyen.com/api/chapters/1698913999?enable_fanfic=0&source_id=78965&index=917&refresh=1').then(({ data }) => data._data.content)
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

export {
  getAuth,
  getChunks,
  getChunkAudio,
  getContent
}
