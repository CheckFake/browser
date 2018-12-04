<template>
    <div class="container-fluid">
        <div v-if="loading">
            Loading...
        </div>
        <div v-if="!loading">
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
                    <div class="col-12 text-center">
                        <h4>Niveau de confiance</h4>
                        <p>
                            <strong>Titre :</strong> {{ page.title }}
                        </p>
                        <span title="Très peu fiable" class="confidence-score-box score-box"
                              v-bind:class="colorClassFromScore(this.confidenceScore, 'bad')">1</span>
                        <span title="Peu fiable" class="confidence-score-box score-box"
                              v-bind:class="colorClassFromScore(this.confidenceScore, 'not-so-bad')">2</span>
                        <span title="Contenu incertain" class="confidence-score-box score-box"
                              v-bind:class="colorClassFromScore(this.confidenceScore, 'meh')">3</span>
                        <span title="Fiable" class="confidence-score-box score-box"
                              v-bind:class="colorClassFromScore(this.confidenceScore, 'not-so-good')">4</span>
                        <span title="Très fiable" class="confidence-score-box score-box"
                              v-bind:class="colorClassFromScore(this.confidenceScore, 'good')">5</span>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-12">
                        <h4>Articles connexes</h4>
                        <p>
                            {{ interestingRelatedArticlesCount }}
                            {{ pluralize("article", interestingRelatedArticlesCount) }} parmi ceux que nous avons
                            analysés
                            {{ pluralize("est", interestingRelatedArticlesCount, "sont", true) }}
                            {{ pluralize("similaire", interestingRelatedArticlesCount) }}
                            à votre article. En voici {{ relatedArticles.length }} :
                        </p>
                        <ul class="list">
                            <li v-for="article in relatedArticles"><a v-bind:href="article.url">{{ article.publisher }}
                                - {{ article.title }}</a></li>
                        </ul>
                    </div>
                </div>
                <hr>
                <button type="button" class="btn btn-outline-secondary btn-sm" v-on:click="details = true"
                        v-if="!details">Plus de détails
                </button>
                <div id="score-details" v-bind:class="this.details ? 'row' : 'hidden'">
                    <div class="col-12">
                        <h4>Détails de la notation</h4>
                        <p>
                            Le score attribué <strong>au contenu</strong> a été calculé en analysant
                            <strong>{{ totalArticles }}</strong>
                            {{ pluralize("autre", totalArticles) }}
                            {{ pluralize("article", totalArticles) }}.<br>
                            Le score attribué <strong>au site</strong> a été calculé par l'analyse précédente de
                            <strong>{{ siteScoreArticlesCount - 1 }}</strong>
                            {{ pluralize("autre", siteScoreArticlesCount) }}
                            {{ pluralize("article", siteScoreArticlesCount) }}.<br>
                            <a href="https://github.com/OnlyTrue-FND/api/wiki/Calcul-du-score">Plus de détails sur la
                                méthode de calcul</a><br>
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
                                    <td v-bind:id="key" class="score">
                                        <span title="Très peu fiable" class="details-score-box score-box"
                                              v-bind:class="colorClassFromScore(score, 'bad')">1</span>
                                        <span title="Peu fiable" class="details-score-box score-box"
                                              v-bind:class="colorClassFromScore(score, 'not-so-bad')">2</span>
                                        <span title="Contenu incertain" class="details-score-box score-box"
                                              v-bind:class="colorClassFromScore(score, 'meh')">3</span>
                                        <span title="Fiable" class="details-score-box score-box"
                                              v-bind:class="colorClassFromScore(score, 'not-so-good')">4</span>
                                        <span title="Très fiable" class="details-score-box score-box"
                                              v-bind:class="colorClassFromScore(score, 'good')">5</span>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
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
                    title: null,
                },
                confidenceScore: null,
                relatedArticles: [],
                scores: [],
                totalArticles: null,
                siteScoreArticlesCount: null,
                interestingRelatedArticlesCount: null,
                errors: [],
                details: false,
                loading: true
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
                        arr = "Site";
                        break;
                }
                return arr;
            },
            toggleDetails() {
                this.details = !this.details;
            },
            /**
             * Returns a color class for the given score. A pastilleColor may be given.
             * If the pastileColor parameter is not given, it will return the color class to apply.
             * If it's given, it will return either the color class to apply,
             * or gray if the pastilleColor and the generated color class don't match.
             *
             * @param {number} score
             * @param {string, null} pastilleColor
             * @returns {string}
             */
            colorClassFromScore(score, pastilleColor = null) {
                let cls = null;
                if (score >= 80) {
                    cls = "good"
                } else if (score >= 60) {
                    cls = "not-so-good"
                } else if (score >= 40) {
                    cls = "meh"
                } else if (score >= 20) {
                    cls = "not-so-bad"
                } else if (score >= 0) {
                    cls = "bad"
                } else {
                    cls = null;
                }
                if (!pastilleColor) {
                    return cls;
                }
                if (pastilleColor === cls) {
                    return cls;
                }
                return 'grey';
            },
            colorFromConfidenceScore() {
                let cls = this.colorClassFromScore(this.confidenceScore);
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
                this.loading = false;
                let tab = tabs[0];
                this.page.title = tab.title;
                this.confidenceScore = data.data.global_score;

                this.scores = data.data.scores;
                this.relatedArticles = data.data.related_articles_selection;
                this.totalArticles = data.data.total_articles;
                this.siteScoreArticlesCount = data.data.site_score_articles_count;
                this.interestingRelatedArticlesCount = data.data.interesting_related_articles_count;

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
                this.loading = false;
                this.errors.push(`${message} : ${error}`);
                console.error(message, error);
            },
            pluralize(word, count, suffix = 's', replace = false) {
                if (replace && count > 1) {
                    return suffix
                } else if (count > 1) {
                    return word + suffix;
                }
                return word
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
                    if (response.ok) {
                        return response.json();
                    }
                    throw "Error 500 from server"
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
