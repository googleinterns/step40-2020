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

import java.io.IOException;
import okhttp3.OkHttpClient;

/** Mock Perspective caller that returns a sample output */
public class MockYoutubeResponse implements ApiCaller {
  public String post(String url, String json, OkHttpClient client) throws IOException {
    return "{\"items\":[{\"snippet\":{\"topLevelComment\":{\"snippet\":{\"textOriginal\":\"Chinese launch: \"details are top secret, China is not even releasing the rover's name\" \u2014 yeah, I am so shocked and surprised from the model of international cooperation, e.g. Belt and Road, \u4e00\u5e26\u4e00\u8def\"}}}}]}";
  }
}
