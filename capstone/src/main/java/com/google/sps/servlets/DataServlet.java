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
import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.Map;
import java.util.HashMap;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

/** Servlet that returns some example content. TODO: modify this file to handle comments data */
@WebServlet("/data")
public class DataServlet extends HttpServlet {

  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    BufferedReader reader = request.getReader();
    JsonObject input = new Gson().fromJson(reader, JsonObject.class);
    
    // String text = getAttribute(input, "text");
		// String lan = getAttribute(input, "lan");

    String text = "Hello world! This is toxic because you are a bad person.";
    String lan = "en";
    

    String APIkey = "AIzaSyDon2uWEJFzlNDRmrLZewNBPSnu1e7-AKc";
    String urlString = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=" + APIkey;
    URL url = new URL(urlString);
    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
    conn.setRequestMethod("POST");
    conn.setDoOutput(true);
    // conn.setRequestProperty("Authorization", encodedCredentials);
    conn.setRequestProperty("Content-Type", "application/json");
    // conn.setRequestProperty( "Accept", "*/*" );
    // JsonObject params = new JsonObject();
		// params.put('comment': {'text': text});

    Map<String, String> parameters = new HashMap<>();
    parameters.put("param1", "val");

    DataOutputStream out = new DataOutputStream(conn.getOutputStream());
    out.writeBytes(getParamsString(parameters));
    out.flush();
    out.close();

    int status = conn.getResponseCode();

    BufferedReader in = new BufferedReader(
      new InputStreamReader(conn.getInputStream()));
    String inputLine;
    StringBuffer content = new StringBuffer();
    while ((inputLine = in.readLine()) != null) {
        content.append(inputLine);
    }
    in.close();
		
		// JSON.stringify({
    //   'comment': {'text': text},
    //   'languages': [lan],
    //   'requestedAttributes': {'TOXICITY': {}}
    // });
		// URLConnection connection = new URL(url + "?" + params).openConnection();
    
		// connection.setRequestMethod("POST");
    // connetion.setRequestProperty("comment", "hardcoded_comment");

		// InputStream response = connection.getInputStream();

    // httpConnection.setDoOutput(true);

    // Gson gson = new Gson();
    // response.setContentType("application/json;");
    // response.getWriter().println(gson.toJson(params));
    response.getWriter().println("test");
  }



  public static String getParamsString(Map<String, String> params) 
    throws UnsupportedEncodingException {
      StringBuilder result = new StringBuilder();

      for (Map.Entry<String, String> entry : params.entrySet()) {
        result.append(URLEncoder.encode(entry.getKey(), "UTF-8"));
        result.append("=");
        result.append(URLEncoder.encode(entry.getValue(), "UTF-8"));
        result.append("&");
      }

      String resultString = result.toString();
      return resultString.length() > 0
        ? resultString.substring(0, resultString.length() - 1)
        : resultString;
  }
}