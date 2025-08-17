const sqliteRepository = require('./sqlite.repository');
const firebaseRepository = require('./firebase.repository');
const authService = require('../../../common/services/authService');

function getBaseRepository() {
    // Always use SQLite repository since Firebase is removed
    return sqliteRepository;
}

const sttRepositoryAdapter = {
    addTranscript: ({ sessionId, speaker, text }) => {
        const uid = authService.getCurrentUserId();
        return getBaseRepository().addTranscript({ uid, sessionId, speaker, text });
    },
    getAllTranscriptsBySessionId: (sessionId) => {
        return getBaseRepository().getAllTranscriptsBySessionId(sessionId);
    }
};

module.exports = sttRepositoryAdapter; 