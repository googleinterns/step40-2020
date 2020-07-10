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

package com.google.sps.servlets;

import java.io.IOException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import java.io.BufferedReader;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import org.json.simple.JSONObject;    
import java.util.ArrayList;
import java.util.Arrays;

/** Servlet that returns youtube api data. */
@WebServlet("/username_servlet")
public class UsernameConverter extends HttpServlet {
  private static final String URL = " https://www.googleapis.com/youtube/v3/channels?key=";
  private static final String Key = "";
  private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
  OkHttpClient client = new OkHttpClient();

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    String userName = request.getParameter("channelId");
    String url = URL + Key + "&forUsername=" + userName + "&part=id";
    String output = run(url);
    response.setContentType("application/json");
    response.getWriter().println(output);  
  }
  
  String run(String url) throws IOException {
    Request request = new Request.Builder()
      .url(url)
      .build();
    try (Response response = client.newCall(request).execute()) {
      return response.body().string();
    }
  }
}