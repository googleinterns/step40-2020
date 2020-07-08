const ATTRIBUTES_BY_LANGUAGE = {
  'en': ['TOXICITY', 'SEVERE_TOXICITY', 'TOXICITY_FAST', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT', 'SEXUALLY_EXPLICIT', 'FLIRTATION'],
  'es': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK_EXPERIMENTAL', 'INSULT_EXPERIMENTAL', 'PROFANITY_EXPERIMENTAL', 'THREAT_EXPERIMENTAL'],
  'fr': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK_EXPERIMENTAL', 'INSULT_EXPERIMENTAL', 'PROFANITY_EXPERIMENTAL', 'THREAT_EXPERIMENTAL'],
  'de': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
  'it': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
  'pt': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT']
};

async function youtube() {
  const channelId = document.getElementById('channelIdForAnalysis').value;
  if (!channelId) {
    return;
  }
  const response = await fetch('/youtube_servlet?channelId=' + channelId,);
  const responseJson = await response.json();
  const comments = responseJson;
  const commentListElement = document.getElementById('comment-list');
  commentListElement.innerHTML = '';
  const requestedAttributes = await getRequestedAttributes();
  let attributeAverages = new Map();
  for (let attribute of requestedAttributes) {
    const attributeScores = [];
    for (let item in comments.items) {
      const perspectiveScore = await callPerspective(comments.items[item].snippet.topLevelComment.snippet.textOriginal, "en", [attribute]);
      attributeScores.push(perspectiveScore);
    }
    attributeScoresSum = arrSum(attributeScores);
    attributeScoresAvg = attributeScoresSum / comments.items.length;
    attributeAverages.set(attribute, attributeScoresAvg)
    commentListElement.append("AVERAGE " + attribute + " : " + attributeScoresAvg);
    commentListElement.appendChild(document.createElement('br'));
  }
  loadChartsApi(attributeAverages);
}

/** Collects the user's input and calls Perspective on it */
async function getRequestedAttributes() {
  const attributes = document.getElementById("available-attributes").getElementsByTagName('input');
  const requestedAttributes = [];
  for (let attribute of attributes) {
    if (attribute.checked == true) {
      requestedAttributes.push(attribute.value);	
    }	
  }
  return requestedAttributes;
}

/** Calls the perspective API */
async function callPerspective(text, lang, requestedAttribute) {
  const response = await fetch('/call_perspective', {
    method: 'POST',
    headers: {'Content-Type': 'application/json',},
    body: JSON.stringify({text: text, lang: lang, requestedAttributes: requestedAttribute})});
  const toxicityData = await response.json();
  return toxicityData.attributeScores[requestedAttribute].summaryScore.value;
}

/** Loads the Google Charts API */
function loadChartsApi(toxicityData) {
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(function() {drawBarChart(toxicityData);}); 
}

/** Draws a Google BarChart from a Perspective JSON. */
function drawBarChart(toxicityData) {
  document.getElementById('chart-container').innerHTML = '';
  const data = google.visualization.arrayToDataTable([[{label: 'Attribute'}, {label: 'Score', type: 'number'}, {role: "style"}]]);
  for (let [attribute, attributeScoresAvg] of toxicityData) {
    var color = '#6B8E23'; // Green
    const score = attributeScoresAvg;
    if (score >= 0.8) {
      color = '#DC143C'; // Red
    } else if (score >= 0.2) {
      color = '#ffd800'; // Yellow
    }
    data.addRow([attribute , score, color]);
  }

  data.sort({column: 1, desc: false});

  const options = {
    title: 'Perspective Feedback',
    bars: 'horizontal',
    height: 700,
    legend: {position: "none"},
    theme: 'material', 
    hAxis: {viewWindow: {min: 0, max: 1}}
  };

  const chart = new google.visualization.BarChart(document.getElementById('chart-container'));
  chart.draw(data, options);
}

/** Shows the avaiable attributes given a language selected on text analyzer page */
function showAvailableAttributes() {
  const langElement = document.getElementById('languageForAnalysis');
  if (!langElement) {
    return;
  }
  const lang = langElement.value;
  const avaiableAttributesElement = document.getElementById('available-attributes');
  avaiableAttributesElement.innerHTML = '';
	
  const attributes = ATTRIBUTES_BY_LANGUAGE[lang];
  attributes.forEach(function(attribute) {
    const checkbox = document.createElement('input');
    checkbox.type = "checkbox";
    checkbox.value = attribute;
    checkbox.id = attribute + '-checkbox';
    checkbox.checked = true;
  
    const label = document.createElement('label');
    label.htmlFor = attribute + '-checkbox';
    label.appendChild(document.createTextNode(attribute));
  
    avaiableAttributesElement.appendChild(checkbox);
    avaiableAttributesElement.appendChild (document.createTextNode (" "));
    avaiableAttributesElement.appendChild(label);
    avaiableAttributesElement.appendChild (document.createTextNode (" "));
  });
}

arrSum = function(arr) {
  return arr.reduce(function(a, b) {
    return a + b
  }, 0);
}
