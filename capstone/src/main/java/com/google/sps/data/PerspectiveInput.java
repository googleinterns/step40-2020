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

package com.google.sps.data;

import java.util.ArrayList;
import java.util.Arrays;

/** An object with the information sent by the user when submitting text */
public final class PerspectiveInput {

  private final String text;
  private final String lang;
  private final ArrayList<String> requestedAttributes;

  public PerspectiveInput(String text, String lang, String[] requestedAttributes) {
    this.text = text;
    this.lang = lang;
    this.requestedAttributes = new ArrayList<String>(Arrays.asList(requestedAttributes));
  }

  public String getText() {
    return this.text;
  }

  public String getLang() {
    return this.lang;
  }

  public ArrayList<String> getRequestedAttributes() {
    return this.requestedAttributes;
	}
}
