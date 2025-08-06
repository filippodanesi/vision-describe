/**
 * Mock data generation utilities for Watson NLU API responses
 */

/**
 * Extract frequently used words from text
 */
export const getFrequentWords = (text: string) => {
  const words = text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .split(/\s+/);
  
  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 3) { // Only consider words with more than 3 characters
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 10);
};

/**
 * Generate mock keywords based on text content
 */
export const generateMockKeywords = (words: string[]) => {
  return words.map((word, index) => {
    const relevance = 0.98 - (index * 0.04);
    return {
      text: word,
      relevance: parseFloat(relevance.toFixed(2))
    };
  });
};

/**
 * Generate mock entities based on text content
 */
export const generateMockEntities = (text: string) => {
  const possibleEntities = [
    { text: "Triumph", type: "Organization" },
    { text: "bras", type: "Product" },
    { text: "straps", type: "Feature" },
    { text: "support", type: "Concept" },
    { text: "design", type: "Concept" },
    { text: "fabrics", type: "Material" },
    { text: "dresses", type: "Product" },
    { text: "tops", type: "Product" },
  ];
  
  return possibleEntities
    .filter(entity => text.toLowerCase().includes(entity.text.toLowerCase()))
    .map((entity, index) => {
      const relevance = 0.95 - (index * 0.05);
      return {
        text: entity.text,
        type: entity.type,
        relevance: parseFloat(relevance.toFixed(2))
      };
    });
};

/**
 * Generate mock concepts based on text content
 */
export const generateMockConcepts = (text: string) => {
  const possibleConcepts = [
    "Lingerie",
    "Fashion",
    "Apparel",
    "Clothing",
    "Undergarments",
    "Style",
    "Comfort",
    "Support"
  ];
  
  return possibleConcepts
    .slice(0, 5)
    .map((concept, index) => ({
      text: concept,
      relevance: parseFloat((0.98 - (index * 0.04)).toFixed(2))
    }));
};

/**
 * Generate mock categories based on text content
 */
export const generateMockCategories = (text: string) => {
  const lowerText = text.toLowerCase();
  
  const categories = [];
  
  if (lowerText.includes("bra") || lowerText.includes("support") || lowerText.includes("comfortable")) {
    categories.push({
      label: "shopping/apparel/underwear",
      score: 0.95
    });
  }
  
  if (lowerText.includes("style") || lowerText.includes("design") || lowerText.includes("dress")) {
    categories.push({
      label: "style and fashion/clothing",
      score: 0.82
    });
  }

  if (lowerText.includes("comfort") || lowerText.includes("fabric") || lowerText.includes("quality")) {
    categories.push({
      label: "shopping/consumer resources/product reviews",
      score: 0.74
    });
  }
  
  return categories.length > 0 ? categories : [
    { label: "shopping/apparel/underwear", score: 0.95 }
  ];
};

/**
 * Generate mock relations based on text content
 */
export const generateMockRelations = (text: string, featuresEnabled: boolean) => {
  if (!featuresEnabled) return [];
  
  const relations = [];
  
  if (text.toLowerCase().includes("triumph") && text.toLowerCase().includes("bra")) {
    relations.push({
      type: "providerOf",
      sentence: "Triumph provides strapless bras designed for secure support.",
      score: 0.87,
      args: [
        { 
          text: "Triumph", 
          entities: [{ type: "Organization" }] 
        },
        { 
          text: "strapless bras", 
          entities: [{ type: "Product" }] 
        }
      ]
    });
  }
  
  if (text.toLowerCase().includes("support") && text.toLowerCase().includes("bra")) {
    relations.push({
      type: "featureOf",
      sentence: "Support is a key feature of the strapless bras.",
      score: 0.82,
      args: [
        { 
          text: "Support", 
          entities: [{ type: "Feature" }] 
        },
        { 
          text: "strapless bras", 
          entities: [{ type: "Product" }] 
        }
      ]
    });
  }
  
  return relations;
};

/**
 * Generate mock emotion analysis
 */
export const generateMockEmotion = (text: string) => {
  return {
    document: {
      emotion: {
        sadness: Math.random() * 0.5,
        joy: Math.random() * 0.5,
        fear: Math.random() * 0.5,
        disgust: Math.random() * 0.5,
        anger: Math.random() * 0.5
      }
    }
  };
};

/**
 * Generate mock sentiment analysis
 */
export const generateMockSentiment = (text: string) => {
  const score = (Math.random() * 2) - 1; // Random score between -1 and 1
  return {
    document: {
      score: parseFloat(score.toFixed(2)),
      label: score > 0 ? "positive" : score < 0 ? "negative" : "neutral"
    }
  };
};

/**
 * Generate mock semantic roles analysis
 */
export const generateMockSemanticRoles = (text: string) => {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  return sentences.map(sentence => ({
    sentence,
    subject: {
      text: sentence.split(" ")[0]
    },
    action: {
      text: sentence.split(" ")[1] || "",
      verb: {
        text: sentence.split(" ")[1] || "",
        tense: "present"
      }
    },
    object: {
      text: sentence.split(" ").slice(2).join(" ")
    }
  }));
};

/**
 * Generate mock syntax analysis
 */
export const generateMockSyntax = (text: string) => {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  return {
    tokens: text.split(/\s+/).map((word, index) => ({
      text: word,
      location: [index * 10, (index + 1) * 10],
      part_of_speech: "NOUN", // Simplified for mock data
      lemma: word.toLowerCase()
    })),
    sentences: sentences.map((sentence, index) => ({
      text: sentence,
      location: [index * 100, (index + 1) * 100]
    }))
  };
};

/**
 * Generate mock classifications (tone analysis)
 */
export const generateMockClassifications = (text: string) => {
  const tones = [
    { tone_id: "excited", score: Math.random() * 0.5 },
    { tone_id: "frustrated", score: Math.random() * 0.3 },
    { tone_id: "impolite", score: Math.random() * 0.2 },
    { tone_id: "polite", score: Math.random() * 0.4 },
    { tone_id: "sad", score: Math.random() * 0.3 },
    { tone_id: "satisfied", score: Math.random() * 0.6 },
    { tone_id: "sympathetic", score: Math.random() * 0.4 }
  ];

  return {
    document: {
      tones: tones.filter(tone => tone.score > 0.1)
    }
  };
};

interface WatsonFeatures {
  keywords: boolean;
  entities: boolean;
  concepts: boolean;
  categories: boolean;
  classifications: boolean;
}

interface WatsonLimits {
  keywords: number;
  entities: number;
  concepts: number;
  categories: number;
}

export const generateMockResponse = (
  text: string,
  features: WatsonFeatures,
  limits: WatsonLimits
): any => {
  const response: any = {
    language: "en",
    usage: {
      text_units: 1,
      text_characters: text.length,
      features: Object.keys(features).filter((key) => features[key as keyof WatsonFeatures]).length,
    },
  };

  if (features.keywords) {
    response.keywords = generateMockKeywords(getFrequentWords(text));
  }

  if (features.entities) {
    response.entities = generateMockEntities(text);
  }

  if (features.concepts) {
    response.concepts = generateMockConcepts(text);
  }

  if (features.categories) {
    response.categories = generateMockCategories(text);
  }

  if (features.classifications) {
    response.classifications = generateMockClassifications(text);
  }

  return response;
};

/**
 * Calculate text statistics
 */
export const calculateTextStats = (text: string) => {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const sentenceCount = (text.match(/[.!?]+/g) || []).length || 1;
  const charCount = text.length;

  return {
    wordCount,
    sentenceCount,
    charCount,
  };
};
