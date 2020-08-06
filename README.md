# # Perspective Hub

At Google, the Conversation AI (ConvAI) team’s mission is to make online conversations safer and less toxic. One of their tools, Perspective API, gives a probability score for text being toxic on a scale from 0 (low probability) to 1 (high probability). Currently, it is implemented in some platforms such as the New York Times, and anyone can play around with it in a textbox halfway through the homepage of perspectiveapi.com. However, Perspective is relatively inaccessible for anyone lacking technical knowledge or simply unaware of the API. In general, our goal is to help ConvAI make the internet a less toxic place, and this means that we want the Perspective to be more readily available and understandable to the general public. This will also add transparency so the outside world can have a better idea of what the team is working on.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites
This app requires Maven. To install Maven run...
```
sudo apt install maven
```
This app requires Java Development Kit. To install Java Development Kit run...
```
sudo apt install default-jdk 
```

## Running the tests

This project feature pre-written tets for the modules. 

To run the various tests run...
```
mvn test 
```

## Deployment

API keys for Datamuse, YouTube Data API and Google Sheets are pre-requisites to delploying the web application

## Built With

* [Perspective API](http://perspectiveapi.com/#/home) - Used to score text for toxicity
* [Datamuse](https://www.datamuse.com/api/) - Used to find replacement words 
* [YouTube Data API](https://developers.google.com/youtube/v3) - Enables YouTube Analyzer to fetch Youtube Data
* [Google Sheets API](https://developers.google.com/sheets/api) - Used to support sheets analysis and output
* [Google Charts](https://developers.google.com/chart) - Used to provide data to site visitors in the form of attarctive charts 
* [Bootstrap 4](https://getbootstrap.com/docs/4.0/getting-started/introduction/) - CSS Framework for visually appealing and responsive elemmts 
* [Maven](https://maven.apache.org/) - Used to manage dependencies
* [Material Design Bootstrap](https://mdbootstrap.com/) - Used to add visual elements that comply with Google's design langauge 

## Contributing

Please contact the [Conversation AI team](https://conversationai.github.io/) for details on their code of conduct, and the process for submitting pull requests to them. 

## Authors

* **Oluwadamilare Alamutu** - *Youtube Analyzer* - [GitHub](https://github.com/olu144)
* **Daniel Ortega** - *Document Analyzer* - [GitHub](https://github.com/#)
* **Christopher Mohri** - *Text Analyzer* - [GitHub](https://github.com/#)

## License

This project is licensed under the Apache 2 License - see the [LICENSE.md](https://github.com/googleinterns/step40-2020/blob/master/LICENSE) file for details

## Acknowledgments

* A huge Thank You goes to our hosts, Daniel Borkan and Lucas Dos Santos as well as the Jigsaw team
