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
import com.google.sps.data.SheetsInput;
import org.json.simple.JSONObject;    
import java.util.ArrayList;
import java.util.Arrays;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.client.util.store.MemoryDataStoreFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.ValueRange;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

/** Servlet that returns Perspective scoring. */
@WebServlet("/call-sheets")
public class SheetsQuickstart extends HttpServlet {
  private static final String APPLICATION_NAME = "Google Sheets API Java Quickstart";
  private static final JsonFactory JSON_FACTORY = JacksonFactory.getDefaultInstance();
  private static final String TOKENS_DIRECTORY_PATH = "tokens";

  /**
    * Global instance of the scopes required by this quickstart.
    * If modifying these scopes, delete your previously saved tokens/ folder.
    */
  private static final List<String> SCOPES = Collections.singletonList(SheetsScopes.SPREADSHEETS);
  private static final String CREDENTIALS_FILE_PATH = "/credentials.json";

  // public static Credential authorize() throws IOException, GeneralSecurityException {
  //     InputStream in = SheetsQuickstart.class.getResourceAsStream(CREDENTIALS_FILE_PATH);
  //     if (in == null) {
  //         throw new FileNotFoundException("Resource not found: " + CREDENTIALS_FILE_PATH);        
  //     }
  //     GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JacksonFactory.getDefaultInstance(), new InputStreamReader(in));
  //     GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(GoogleNetHttpTransport.newTrustedTransport(), JacksonFactory.getDefaultInstance(), clientSecrets, SCOPES)
  //             .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(TOKENS_DIRECTORY_PATH)))
  //             .setAccessType("offline").build();
  //     LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();

  //     System.out.println("GOT HERE BEFORE");
  //     Credential credential = new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
  //     System.out.println("GOT HERE AFTER");
  //     return credential;
  // }

  private static Credential authorize() throws IOException, GeneralSecurityException {
    // Load client secrets
    InputStream in = SheetsQuickstart.class.getResourceAsStream(CREDENTIALS_FILE_PATH);
    if (in == null) {
        throw new FileNotFoundException("Resource not found: " + CREDENTIALS_FILE_PATH);        
    }
    GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in));

    // Set up authorization code flow
    GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(GoogleNetHttpTransport.newTrustedTransport(), JSON_FACTORY, clientSecrets, SCOPES)
        .setDataStoreFactory(new FileDataStoreFactory(new java.io.File(TOKENS_DIRECTORY_PATH)))
        .build();

    // Authorize
    System.out.println("STARTED AUTHORIZATION");
    return new AuthorizationCodeInstalledApp(flow, new LocalServerReceiver.Builder().setPort(8888).build()).authorize("user");
  }

  public static Sheets getSheetsService() throws IOException, GeneralSecurityException {
    Credential credential = authorize();
    System.out.println("FINISHED AUTHORIZATION");
    return new Sheets.Builder(
      GoogleNetHttpTransport.newTrustedTransport(), 
      JacksonFactory.getDefaultInstance(), credential)
      .setApplicationName(APPLICATION_NAME)
      .build();
  }

  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    Sheets service = null;
    try {
      service = getSheetsService(); // Execution stops here for now
    } catch (Exception e) {
      e.printStackTrace();
      // Print an error message
      return;
    }

    // Return Perspective's results
    response.setContentType("text/html");
    response.getWriter().println("DONE");
  }
}

// // Get the input
// String data = request.getReader().readLine();
// Gson gson = new Gson();		
// SheetsInput info = gson.fromJson(data, SheetsInput.class);

// String spreadsheetId = info.getID();

// String output = "";
// final String range = "Class Data!A2:E";

// ValueRange TESTINGresponse = service.spreadsheets().values()
//           .get(spreadsheetId, range)
//           .execute();

// List<List<Object>> values = TESTINGresponse.getValues();
// if (values == null || values.isEmpty()) {
//     System.out.println("No data found.");
// } else {
//     System.out.println("Name, Major");
//     for (List row : values) {
//         // Print columns A and E, which correspond to indices 0 and 4.
//         System.out.printf("%s, %s\n", row.get(0), row.get(4));
//     }
// }

//   /**
//   * Prints the names and majors of students in a sample spreadsheet:
//   * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
//   */
// public static void main(String... args) throws IOException, GeneralSecurityException {
//     // Build a new authorized API client service.
//     final NetHttpTransport HTTP_TRANSPORT = GoogleNetHttpTransport.newTrustedTransport();
//     final String spreadsheetId = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms";
//     final String range = "Class Data!A2:E";
//     Sheets service = new Sheets.Builder(HTTP_TRANSPORT, JSON_FACTORY, getCredentials(HTTP_TRANSPORT))
//             .setApplicationName(APPLICATION_NAME)
//             .build();
//     ValueRange response = service.spreadsheets().values()
//             .get(spreadsheetId, range)
//             .execute();
//     List<List<Object>> values = response.getValues();
//     if (values == null || values.isEmpty()) {
//         System.out.println("No data found.");
//     } else {
//         System.out.println("Name, Major");
//         for (List row : values) {
//             // Print columns A and E, which correspond to indices 0 and 4.
//             System.out.printf("%s, %s\n", row.get(0), row.get(4));
//         }
//     }
// }
