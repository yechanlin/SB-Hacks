// API utility functions

const API_BASE_URL = '/api/sessions';

/**
 * Create a new interview session
 * @param {Object} config - Interview configuration
 * @param {Object} resume - Resume information
 * @returns {Promise<Object>} The created session
 */
export async function createSession(config, resume) {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          role: config.role,
          customRole: config.customRole,
          companyName: config.companyName,
          interviewType: config.interviewType,
          // Map frontend difficulty values to backend enum values
          difficulty: config.difficulty === 'entry' ? 'easy'
            : config.difficulty === 'senior' || config.difficulty === 'lead' ? 'hard'
              : config.difficulty === 'mid' ? 'mid'
                : 'mid', // default fallback
          interactionMode: config.interactionMode,
        },
        resume: {
          fileName: resume.fileName || '',
          content: resume.content || config.resumeContent || '',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Add a conversation message to a session
 * @param {string} sessionId - The session ID
 * @param {string} role - Message role ('user' or 'assistant')
 * @param {string} content - Message content
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<Object>} The created conversation
 */
export async function addConversation(sessionId, role, content, metadata = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/${sessionId}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        content,
        timestamp: new Date().toISOString(),
        metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add conversation');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding conversation:', error);
    throw error;
  }
}

/**
 * End a session
 * @param {string} sessionId - The session ID
 * @param {Object} statistics - Optional session statistics
 * @returns {Promise<Object>} The updated session
 */
export async function endSession(sessionId, statistics = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/${sessionId}/end`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statistics,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to end session');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error ending session:', error);
    throw error;
  }
}

/**
 * Generate feedback for a completed interview session using Gemini AI
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} The generated feedback report
 */
export async function generateFeedback(sessionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${sessionId}/feedback/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate feedback');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating feedback:', error);
    throw error;
  }
}

/**
 * Get all conversations for a session (debug)
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} The conversations
 */
export async function getConversations(sessionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${sessionId}/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch conversations');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

/**
 * Get the latest feedback report for a session
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} The feedback report
 */
export async function getFeedback(sessionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/${sessionId}/report`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch feedback');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching feedback:', error);
    throw error;
  }
}
