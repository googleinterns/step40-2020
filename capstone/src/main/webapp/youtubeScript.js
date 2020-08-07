// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const ATTRIBUTES_BY_LANGUAGE = {
  'en': ['TOXICITY', 'SEVERE_TOXICITY', 'TOXICITY_FAST', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT', 'SEXUALLY_EXPLICIT', 'FLIRTATION'],
  'es': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK_EXPERIMENTAL', 'INSULT_EXPERIMENTAL', 'PROFANITY_EXPERIMENTAL', 'THREAT_EXPERIMENTAL'],
  'fr': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK_EXPERIMENTAL', 'INSULT_EXPERIMENTAL', 'PROFANITY_EXPERIMENTAL', 'THREAT_EXPERIMENTAL'],
  'de': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
  'it': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
  'pt': ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT']
};

/** Category names are mapped to youtube category numbers. This data is from https://gist.github.com/dgp/1b24bf2961521bd75d6c */
const YOUTUBE_CATEGORIES = {
  'Autos&Vehicles': 2,
  'Comedy': 23,
  'Entertainment': 24,
  'Film&Animation': 1,
  'Gaming': 20,
  'Music': 10,
  'Pets&Animals': 15,
  'Science&Technology': 28,
  'Sports' : 17,
};

/** Calls youtube servlet and passes output to perspctive */
async function callYoutube() {
  resetChart();
  document.getElementById('search-type').innerHTML = "";
  const channelId = document.getElementById('channelIdForAnalysis').value.replace(/ /g, '');
  if (!channelId) {
    return;
  }
  // Checks if input is a category, if so directs input to be handled by get trending
  if (YOUTUBE_CATEGORIES[channelId] != undefined) {
    document.getElementById('search-type').innerHTML = "Category Search";
    getTrending(YOUTUBE_CATEGORIES[channelId]);
    return;
  }
  /** Checks if input follows channel ID format, if not attempts to convert it to channel ID*/
  let response;
  let responseJson;
  if (channelId[0] == "U" && channelId[1] == "C" && channelId.length == 24 && isLetter(channelId[channelId.length-1])) {;
    responseJson = await callYoutubeServlet("channelId", channelId);
    if (responseJson.hasOwnProperty('error')) {
      alert("Invalid Channel ID");
      return;
    }
    document.getElementById('search-type').innerHTML = "Channel ID Search";
  } else {
    const usernameConverterResponseJson = await callYoutubeUsernameServlet(channelId);
    if (usernameConverterResponseJson.pageInfo.totalResults == 0) {
      alert("Username Not found, Please Input Channel ID");
      return;
    }
    document.getElementById('search-type').innerHTML = "Username Search";
    const convertedUserName = usernameConverterResponseJson.items[0].id;
    responseJson = await callYoutubeServlet("channelId", convertedUserName);
  }
  inputCommentsToPerspective([responseJson]);
}

/** Calls perspective to analyze an array of comment JSON's */
async function inputCommentsToPerspective(commentsList) {
  const langElement = document.getElementById('languageForAnalysis');
  if (!langElement) {
    return;
  }
  const commentListElement = document.getElementById('comment-list');
  commentListElement.innerHTML = '';
  const requestedAttributes = getRequestedAttributes();
  if (!requestedAttributes) {
      return;
  }
  const attributeScoresPromises = [];
  const analyzedComments = [];
  for (const comments in commentsList) {
    for (const item in commentsList[comments].items) {
      let commentText = commentsList[comments].items[item].snippet.topLevelComment.snippet.textOriginal;
      analyzedComments.push(commentText);
      const perspectiveScore = await callPerspective(commentText, langElement.value, requestedAttributes);
      attributeScoresPromises.push(perspectiveScore);
    }
  }
  let totalNumberOfComments = commentsList[0].items.length * commentsList.length;
  await Promise.all(attributeScoresPromises).then(resolvedAttributeScores => {
    const attributeData = getAttributeData(resolvedAttributeScores);
    const attributeTotals = getAttributeTotals(resolvedAttributeScores);
    const attributeAverages = getAttributeAverages(attributeTotals, totalNumberOfComments);
    loadChartsApi(attributeAverages);
    perspectiveToxicityScale(attributeAverages);
    beginDownload(analyzedComments, attributeData);
  });
}

/** Returns a map of attribute score sums from an array of JSON's */
function getAttributeTotals(attributeScores) {
  const requestedAttributes = getRequestedAttributes();
  const attributeTotals = new Map();    
  for (let i = 0; i < requestedAttributes.length; i++) {
    for (let j = 0; j < attributeScores.length; j++) {
      // Populates attributeTotals to support averaging
      let attributeScoreValue = attributeScores[j].attributeScores[requestedAttributes[i]].summaryScore.value;
      if (attributeTotals.has(requestedAttributes[i])) {
        attributeTotals.set(requestedAttributes[i], attributeTotals.get(requestedAttributes[i]) + attributeScoreValue);
      } else {
        attributeTotals.set(requestedAttributes[i], attributeScoreValue);
      }
    }
  }
  return attributeTotals;
}

/** Returns a map of attribute score averages from a map and an array */
function getAttributeAverages(attributeTotals, totalNumberOfComments) {
  const attributeAverages = new Map();
  for (const [attribute, attributeScoresTotal] of attributeTotals) {
    attributeAverages.set(attribute, attributeScoresTotal / totalNumberOfComments);
  }
  return attributeAverages;
}

/** Returns the user's input */
function getRequestedAttributes() {
  const attributes = document.getElementById("available-attributes").getElementsByTagName('input');
  const requestedAttributes = [];
  for (const attribute of attributes) {
    if (attribute.checked == true) {
      requestedAttributes.push(attribute.value);	
    }	
  }
  return requestedAttributes;
}

/** Calls the perspective API */
async function callPerspective(text, lang, requestedAttributes) {
  const response = await fetch('/call_perspective', {
    method: 'POST',
    headers: {'Content-Type': 'application/json',},
    body: JSON.stringify({text: text, lang: lang, requestedAttributes: requestedAttributes})});
  const toxicityData = await response.json();
  return toxicityData;
}

/** Loads the Google Charts API */
function loadChartsApi(toxicityData) {
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(function() {drawBarChart(toxicityData);}); 
}

/** Draws a Google BarChart from a map. */
function drawBarChart(toxicityData) {
  document.getElementById('chart-container').innerHTML = '';
  const data = google.visualization.arrayToDataTable([[{label: 'Attribute'}, {label: 'Score', type: 'number'}, {role: "style"}]]);
  for (const [attribute, attributeScoresAvg] of toxicityData) {
    let color = '#6B8E23'; // Green
    const score = attributeScoresAvg;
    if (score >= 0.8) {
      color = '#DC143C'; // Red
    } else if (score >= 0.2) {
      color = '#ffd800'; // Yellow
    }
    data.addRow([attribute, score, color]);
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
  const availableAttributesElement = document.getElementById('available-attributes');
  availableAttributesElement.innerHTML = '';
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
    availableAttributesElement.appendChild(checkbox);
    availableAttributesElement.appendChild(label);
    availableAttributesElement.appendChild(document.createTextNode(" "));
  });
}

/** Checks if a character is a letter */
function isLetter(character) {
  return (character.charCodeAt() >= 65 && character.charCodeAt() <= 90) || (character.charCodeAt() >= 97 && character.charCodeAt() <= 122); 
}

/** Fetches top videos by categoty Id */
async function getTrending(categoryId) {
  const trendingResponseJson = await callYoutubeTrendingServlet(categoryId);
  const trendingVideoIds = [];
  for (const item in trendingResponseJson.items) {
    const videoId = trendingResponseJson.items[item].id;
    trendingVideoIds.push(videoId);
  }
  const commentsListPromises = [];
  for (const id in trendingVideoIds) {
    const videoCommentListJson = await callYoutubeServlet("videoId", trendingVideoIds[id]);
    commentsListPromises.push(videoCommentListJson);
  }
  await Promise.all(commentsListPromises).then(resolvedCommentsList => {
    inputCommentsToPerspective(resolvedCommentsList);
  });
}

/** Enables and disables input into the text field */
function textInputToggle(button, toEnable) {
  if (button.checked) {
    if (toEnable) {
      document.getElementById('channelIdForAnalysis').value = button.id;
      document.getElementById('channelIdForAnalysis').disabled = true;
    } else {
      document.getElementById('channelIdForAnalysis').value = "";
      document.getElementById('channelIdForAnalysis').disabled = false;
    }
  }
}

/** Creates radio buttons to allow teh user to select between various categories */
function showCategories() {
  // Creates button to enable manual input
  const radiobox = document.createElement('input');
  radiobox.type = 'radio';
  radiobox.id = 'manualInput';
  radiobox.value = 'manualInput';
  radiobox.name = 'same';
  radiobox.checked  = true;
  const label = document.createElement('label');
  label.htmlFor = 'manualInput';
  const description = document.createTextNode('ID/Username');
  label.appendChild(description);
  radiobox.onclick = function() {
    textInputToggle(this, false);   
  }
  const categoryContainer = document.getElementById('category-container');
  categoryContainer.appendChild(radiobox);
  categoryContainer.appendChild(label);
  categoryContainer.appendChild(document.createTextNode(" "));
  categoryContainer.appendChild(document.createElement("br"));
  // Creates buttons for all youtube categories
  for (const category in YOUTUBE_CATEGORIES ) {
    const radiobox = document.createElement('input');
    radiobox.type = 'radio';
    radiobox.id = category;
    radiobox.value = category;
    radiobox.name = 'same';
    const label = document.createElement('label')
    label.htmlFor = category;
    const description = document.createTextNode(category);
    label.appendChild(description);
    radiobox.onclick = function() {
      textInputToggle(this, true);   
    }
    const categoryContainer = document.getElementById('category-container');
    categoryContainer.appendChild(radiobox);
    categoryContainer.appendChild(label);
    categoryContainer.appendChild(document.createTextNode(" "));
  }
}

async function callYoutubeServlet(idType, id) {
  const response = await fetch('/youtube_servlet', {
    method: 'POST',
    headers: {'Content-Type': 'application/json',},
    body: JSON.stringify({idType: idType, id: id})});
  return await response.json();
}

async function callYoutubeUsernameServlet(channelId) {
  const response = await fetch('/youtube_username_servlet', {
    method: 'POST',
    headers: {'Content-Type': 'application/json',},
    body: channelId});
  return await response.json();
}

async function callYoutubeTrendingServlet(categoryId) {
  const response = await fetch('/trending_servlet', {
    method: 'POST',
    headers: {'Content-Type': 'application/json',},
    body: categoryId});
  return await response.json();
  
/** Converts perspective results to knoop scale then to mohs */
function getScoreInMohs(attributeAverages) {
  // Each index represents a value on the mohs scale and each value represents the highest knoop score that can be correlated with that mohs score *exclusive*. The values are from http://www.themeter.net/durezza_e.htm
  const knoopScale = [1, 32, 135, 163, 430, 560, 820, 1340, 1800, 7000];
  let totalToxicityScore = 0;
  for (const [attribute, attributeAverage] of attributeAverages) {
    totalToxicityScore += attributeAverage;
  }
  const inputLength = attributeAverages.size;
  const averageToxicityScore = totalToxicityScore / inputLength;
  const knoopScore = averageToxicityScore * 7000;
  let knoopLow;
  let knoopHigh;
  let mohsScore;
  for (let i = 0; i < knoopScale.length; i++) {
    if (knoopScore < knoopScale[i]) {
      if (knoopScore < 1) {
        knoopLow = 0;
      } else {
        knoopLow = knoopScale[i-1];
      }
      knoopHigh = knoopScale[i];
      mohsScore = i;  
      break;
    }
  }
  const knoopRange = knoopHigh - knoopLow;
  const amountMoreThanKnoop = knoopScore - knoopLow;
  const mohsDecimal = amountMoreThanKnoop / knoopRange;
  const completeMohsScore = (mohsScore + mohsDecimal).toFixed(1);
  return completeMohsScore;
}

/** Displays the perspective toxicity scale score */
function showPerspectiveToxicityScale(attributeAverages) {
  const perspectiveToxicityScore = getScoreInMohs(attributeAverages);
  document.getElementById('search-type').appendChild(document.createElement("br"));  
  document.getElementById('search-type').append("Perspective Toxicity Score" + " : " + perspectiveToxicityScore);
}

/** Returns top Youtube results by keyword to have their comments analyzed*/
async function getKeywordSearchResults() {
  resetChart();
  const searchTerm = document.getElementById('channelIdForAnalysis').value;
  const response = await fetch('/keyword_search_servlet?searchTerm=' + searchTerm);
  const responseJson = await response.json();
  let videoIdList = [];
  for (const item in responseJson.items) {
    if (responseJson.items[item].id.videoId != undefined) {
      let videoId = responseJson.items[item].id.videoId;
      videoIdList.push(videoId);
    }
  }   
  const commentsListPromises = [];
  for (const id in videoIdList) {
    videoCommentList = await fetch('/youtube_servlet?videoId=' + videoIdList[id]);
    videoCommentListJson = await videoCommentList.json();
    commentsListPromises.push(videoCommentListJson);
  }
  await Promise.all(commentsListPromises).then(resolvedCommentsList => {
    inputCommentsToPerspective(resolvedCommentsList);
  });
  document.getElementById('search-type').innerHTML = "Keyword Search";
}

/** Prepares CSV download*/
function prepareDownload(sheetHeader, sheetData, sheetName) {
  let csv = sheetHeader.join(',') + '\n';
  for (const data of sheetData) {
    csv += data.join(',') + '\n';
  }
  const outputCsv = new Blob([csv], { type: 'text/csv' });  
  const downloadUrl = URL.createObjectURL(outputCsv);
  const downloadElement = document.getElementById('download');
  downloadElement.href = downloadUrl;
  downloadElement.download = sheetName + '.csv';
}

/** Formats data and initiates download of CSV file*/
function beginDownload(analyzedComments, attributeData) { 
  const requestedAttributes = getRequestedAttributes();
  requestedAttributes.unshift('COMMENT');
  const sheetHeader = requestedAttributes;
  for (let i = 0; i < attributeData.length; i++) {
    const comment = formatCommentForSpreadsheet(analyzedComments[i]);
    attributeData[i].unshift(comment);
  }
  const sheetName = 'Perspective_Output';
  prepareDownload(sheetHeader, attributeData, sheetName);
}

/** Clears on screen elements and empties arrays associated with CSV creation*/
function resetChart() {
  document.getElementById('chart-container').innerHTML = "";
  document.getElementById('perspective-toxicity-score').innerHTML = "";
}

/** Removes whitespace, commas and newlines to allow comments to be comaptible with CSV*/
function formatCommentForSpreadsheet(comment) {
  let formattedComment = comment.replace(/(\r\n|\n|\r)/gm, " ");
  formattedComment = formattedComment.replace(/,/g, "");
  formattedComment = formattedComment.replace(/\s+/g, " ");
  return formattedComment;    
}

/** Returns an array of attribute data to support CSV output*/
function getAttributeData(attributeScores) {
  const requestedAttributes = getRequestedAttributes();
  const attributeData = [];    
  for (let i = 0; i < requestedAttributes.length; i++) {
    for (let j = 0; j < attributeScores.length; j++) {
      // Populates attributeData to support CSV output
      let attributeScoreValue = attributeScores[j].attributeScores[requestedAttributes[i]].summaryScore.value;
      if (attributeData[j] == null) {
        attributeData[j] = [attributeScoreValue];
      } else {
        attributeData[j].push(attributeScoreValue);
      }
    }
  }
  return attributeData;
}
