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

// API key from the Developer Console
const API_KEY = 'API_KEY'; // TODO: Create Java servlet to return key

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://docs.googleapis.com/$discovery/rest?version=v1"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const API_SCOPE = "https://www.googleapis.com/auth/documents.readonly";

/** Collects the user's input and submits it for analysis */
async function gatherDocsInput() {
  // Get the submitted id and language
  const idElement = document.getElementById('doc-id');
  if (!idElement) {
    return;
  }
  let id = idElement.value;

  // Search for a URL in the format ".../d/DOC_ID/..."
  const search = idElement.value.match(/\/d\/([\w-]+)/);
  if (search != null) {
    id = search[1]; // Shorten full URL to just the ID
  }

  const lang = getRequestedLanguage();
  if (lang == null) {
    return;
  }

  // Get the selected attributes
  const attributes = document.getElementById("available-attributes").getElementsByTagName('input');
  const requestedAttributes = [];
  for (const attribute of attributes) {
    if (attribute.checked) {
      requestedAttributes.push(attribute.value);	
    }	
  }

  // Get the selected analysis type
  const radios = document.getElementsByName('analysisRadios');
  let tokenizer;
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked && radios[i].value != 'NONE') {
      tokenizer = TokenizerEnum[radios[i].value];
      break;
    }
  }

  const text = await getTextFromDoc(id);
  handleInput(text, lang, requestedAttributes, tokenizer);
}

/**
 * Returns all text contained within the Google Doc with corresponsing documentId
 */
async function getTextFromDoc(documentId) {
  const response = await gapi.client.docs.documents.get({
    documentId: documentId
  });
  const content = await response.result.body.content;
  return readStructrualElements(content);
}


/** 
  * Recurses through a list of Structural Elements to read 
  * a document's text where text may be in nested elements.
  */
function readStructrualElements(elements) {
  let stringOutput = '';
  for (const element of elements) {
    if (element.paragraph != null) {
      for (const paragraphElement of element.paragraph.elements) {
        stringOutput = stringOutput + readParagraphElement(paragraphElement);
      }
    } else if (element.table != null) {
      for (const row of element.table.tableRows) {
        for (const cell of row.tableCells) {
          stringOutput = stringOutput + readStructrualElements(cell.content);
        }
      }
    } else if (element.tableOfContents != null) {
      stringOutput = stringOutput + readStructrualElements(element.tableOfContents.content);
    }
  }
  return stringOutput;
}

/** 
  * Returns the text in a paragraph element from a Google Doc
  */
function readParagraphElement(paragraphElement) {
  const run = paragraphElement.textRun;
  if (run == null || run.content == null) {
    // The TextRun can be null if there is an inline object.
    return "";
  }
  return run.content;
}
