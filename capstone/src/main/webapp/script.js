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

attributeData = {
  "attributeScores": {
    "THREAT": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.18365456,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.18365456,
        "type": "PROBABILITY"
      }
    },
    "TOXICITY": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.96509165,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.96509165,
        "type": "PROBABILITY"
      }
    },
    "INSULT": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.60424614,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.60424614,
        "type": "PROBABILITY"
      }
    },
    "SEVERE_TOXICITY": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.7285898,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.7285898,
        "type": "PROBABILITY"
      }
    },
    "IDENTITY_ATTACK": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.13047843,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.13047843,
        "type": "PROBABILITY"
      }
    },
    "PROFANITY": {
      "spanScores": [
        {
          "begin": 0,
          "end": 4,
          "score": {
            "value": 0.9831821,
            "type": "PROBABILITY"
          }
        }
      ],
      "summaryScore": {
        "value": 0.9831821,
        "type": "PROBABILITY"
      }
    }
  },
  "languages": [
    "en"
  ],
  "detectedLanguages": [
    "en"
  ]
};

function loadChartsApi() {
  google.charts.load('current', {'packages':['bar']});
  google.charts.setOnLoadCallback(drawBarChart); 
}

/** Fetches page vote data and uses it to create a chart. */
function drawBarChart() {
  const data = new google.visualization.DataTable();
  data.addColumn('string', '');
  data.addColumn('number', 'Score');
  Object.keys(attributeData.attributeScores).forEach((attribute) => {
    data.addRow([attribute, attributeData.attributeScores[attribute].summaryScore.value]);
  });

  const options = {
    title: 'Attribute Feedback',
    subtitle: 'from Perspective API',
    series: {
      0: { color: '#DC143C' }
    },
    bars: 'horizontal',
    height: 700,
  };

  const chart = new google.charts.Bar(document.getElementById('chart-container'));
  chart.draw(data, google.charts.Bar.convertOptions(options));
}
