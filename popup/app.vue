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
            <p>Les erreurs seront probablement affichées en anglais.
                Merci de nous contacter via le lien ci-dessous si vous rencontrez une erreur
                alors que vous pensiez obtenir un résultat.</p>
            <ul class="list">
                <li v-for="error in errors">{{ error }}</li>
            </ul>
        </div>
        <div id="popup-content" v-else>
            <div class="row">
                <div class="col-12">
                    <h4>Informations générales</h4>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <strong>Page :</strong> {{ page.url }}
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <strong>Auteur :</strong> {{ page.author }}
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-12">
                    <h4>Niveau de confiance</h4>
                    <p>
                        <a href="#">Lien vers les correspondances couleur/niveau de confiance.</a>
                    </p>
                </div>
            </div>
            <div class="row">
                <div class="col-12 text-center">
                    <span class="confidence-score-box" v-bind:class="colorClassFromConfidenceScore()"></span>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-12">
                    <h4>Articles connexes</h4>
                    <ul class="list">
                        <li v-for="article in relatedArticles"><a v-bind:href="article.url">{{ article.publisher }} - {{ article.title }}</a></li>
                    </ul>
                </div>
            </div>
            <hr>
            <div id="score-details" class="row">
                <div class="col-12">
                    <h4>Détails de la notation</h4>
                    <p>
                        Le score attribué à la page a été calculé en analysant
                        <span class="emphasize">{{ totalArticles }}</span> autre(s) article(s).<br>
                        Voici le détail des scores :
                    </p>
                    <div class="table-responsive">
                        <table class="table table-sm table-hover table-bordered">
                            <thead>
                            <tr>
                                <th scope="col">Élément</th>
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
            <a href="https://github.com/Crocmagnon/fake-news-detector/issues/new">Signaler un problème</a>
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
                switch (arr) {
                    case "content":
                        arr = "Contenu";
                        break;
                    case "site":
                        arr = "Nom de domaine";
                        break;
                }
                return arr;
            },
            colorClassFromConfidenceScore() {
                let cls = null;
                if (this.confidenceScore >= 80) {
                    cls = "good"
                }
                else if (this.confidenceScore >= 60) {
                    cls = "not-so-good"
                }
                else if (this.confidenceScore >= 40) {
                    cls = "meh"
                }
                else if (this.confidenceScore >= 20) {
                    cls = "not-so-bad"
                }
                else if (this.confidenceScore >= 0) {
                    cls = "bad"
                }
                else {
                    cls = null;
                }
                return cls;
            },
            colorFromConfidenceScore() {
                let cls = this.colorClassFromConfidenceScore();
                switch (cls) {
                    case "good":
                        return "#007a1c";
                    case "not-so-good":
                        return "#bbff00";
                    case "meh":
                        return "#ffee00";
                    case "not-so-bad":
                        return "#f29646";
                    case "bad":
                        return "#b61a20";
                }
                return cls
            },
            displayConfidenceScore(data, tabs) {
                let tab = tabs[0];

                this.page.url = tab.url;
                this.page.author = "Inconnu";
                this.confidenceScore = data.data.global_score;

                this.scores = data.data.scores;
                this.relatedArticles = data.data.related_articles_selection;
                this.totalArticles = data.data.total_articles;

                return {
                    color: {
                        color: this.colorFromConfidenceScore(),
                        tabId: tab.id,
                    },
                    text: {
                        tabId: tab.id,
                        text: " "
                    }
                };
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

            let badgeDetailsPromise = Promise.all([activeTabPromise, getScorePromise])
                .then(([tabs, data]) => this.displayConfidenceScore(data, tabs))
                .catch(error => {
                    let message = 'Error displaying score';
                    this.displayError(message, error);
                });
            badgeDetailsPromise
                .then(details => browser.browserAction.setBadgeBackgroundColor(details.color));
            badgeDetailsPromise
                .then(details => browser.browserAction.setBadgeText(details.text));

        }
    }
</script>