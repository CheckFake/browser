<template>
    <div class="container-fluid">
        <div>
            <div class="row">
                <h1 class="col-12 popup-title">
                    <img src="../icons/logo.svg" height="48" width="48" alt="Logo"> OnlyTrue
                </h1>
            </div>
            <hr>
        </div>
        <div id="error-content" v-if="errors.length > 0">
            <h4>Errors</h4>
            <ul class="list">
                <li v-for="error in errors">{{ error }}</li>
            </ul>
        </div>
        <div id="popup-content" v-else>
            <div class="row">
                <div class="col-12">
                    <strong>Page :</strong> {{ page.url }}
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <strong>Author :</strong> {{ page.author }}
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <span class="confidence-score">{{ confidenceScore }}</span>%
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <meter min="0" low="40" high="70" optimum="100" max="100" v-bind:value="confidenceScore" title="%"
                           id="confidence-meter"></meter>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-12">
                    <h4>Related articles</h4>
                    <ul class="list">
                        <li v-for="article in relatedArticles"><a v-bind:href="article.url">{{ article.publisher }} - {{ article.title }}</a></li>
                    </ul>
                </div>
            </div>
            <hr>
            <div id="score-details" class="row">
                <div class="col-12">
                    <h4>Scoring details</h4>
                    <p>
                        The page was given a confidence score of
                        <span class="emphasize">{{ confidenceScore }}%</span>.
                        This score was computed by analyzing
                        <span class="emphasize">{{ totalArticles }}</span> other article(s).<br>
                        Here are the detailed scores :
                    </p>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover table-bordered">
                            <thead>
                            <tr>
                                <th scope="col">Item</th>
                                <th scope="col">Score</th>
                            </tr>
                            </thead>
                            <tbody id="scores">
                            <tr v-for="(score, key) in scores">
                                <th scope="row">{{ getItemNameFromKey(key) }}</th>
                                <td v-bind:id="key" class="score">{{ score }}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div class="feedback">
            <a href="https://github.com/Crocmagnon/fake-news-detector/issues/new">Give feedback</a>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                page: {
                    url: null,
                    author: null
                },
                confidenceScore: null,
                relatedArticles: [],
                scores: [],
                totalArticles: null,
                errors: []
            }
        },
        methods: {
            getItemNameFromKey(key) {
                let arr = key.split("_");
                arr.pop();
                arr = arr.join(" ");
                return this.capitalizeFirstLetter(arr);
            },
            capitalizeFirstLetter(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            },
            displayConfidenceScore(data, tabs) {
                let tab = tabs[0];

                this.page.url = tab.url;
                this.page.author = "Unknown";
                this.confidenceScore = data.data.global_score;

                this.scores = data.data.scores;
                this.relatedArticles = data.data.related_articles_selection;
                this.totalArticles = data.data.total_articles;

                let badgeDetails = {
                    tabId: tab.id,
                    text: data.data.global_score.toString()
                };
                return browser.browserAction.setBadgeText(badgeDetails);
            },
            displayError(message, error) {
                this.errors.push(`${message} : ${error}`);
                console.error(message, error);
            }
        },
        created() {
            /**
             * Queries the API for the scores of the current tab
             */
            function queryAPI(tabs) {
                let url = encodeURIComponent(tabs[0].url);
                return fetch(`https://fakenewsdetector.augendre.info/api/page?url=${url}`);
            }

            /**
             * Queries browser for the active tab.
             */
            function getActiveTab() {
                let tabQuery = {active: true, currentWindow: true};
                return browser.tabs.query(tabQuery);
            }

            let backgroundColorDetails = {
                color: "#FFD729"
            };

            let activeTabPromise = getActiveTab()
                .catch(error => {
                    let message = 'Error getting active tab';
                    this.displayError(message, error);
                });

            let getScorePromise = activeTabPromise
                .then(queryAPI)
                .then(response => {
                    return response.json();
                })
                .then(data => {
                    if (data.status !== 'success') {
                        throw data.data.message;
                    }
                    return data;
                })
                .catch(error => {
                    let message = 'Error computing score';
                    this.displayError(message, error);
                });

            Promise.all([activeTabPromise, getScorePromise, browser.browserAction.setBadgeBackgroundColor(backgroundColorDetails)])
                .then(([tabs, data]) => this.displayConfidenceScore(data, tabs))
                .catch(error => {
                    let message = 'Error displaying score';
                    this.displayError(message, error);
                });

        }
    }
</script>