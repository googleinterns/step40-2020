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

/** Mock Perspective caller that returns an empty comment error */
public class MockPerspCallerNullInput implements ApiCaller {
  public String post(String url, String json, OkHttpClient client) throws IOException {
    return "{ \"error\": { \"code\": 400," +
      "\"message\": \"Comment must be non-empty.\"," +
      "\"status\": \"INVALID_ARGUMENT\"," +
      "\"details\": [ { \"@type\": \"type.googleapis.com/google.commentanalyzer.v1alpha1.Error\", \"errorType\": \"COMMENT_EMPTY\" }]}}";
  }
}
