<template>
    <div class="container-fluid">
        <div>
            <div class="row">
                <h1 class="col-12 popup-title">
                    <img src="../icons/logo.svg" height="48" width="48" alt="Logo"> CheckFake
                </h1>
            </div>
            <hr>
        </div>
        <div v-if="loading">
            <div class="sk-cube-grid">
                <div class="sk-cube sk-cube1"></div>
                <div class="sk-cube sk-cube2"></div>
                <div class="sk-cube sk-cube3"></div>
                <div class="sk-cube sk-cube4"></div>
                <div class="sk-cube sk-cube5"></div>
                <div class="sk-cube sk-cube6"></div>
                <div class="sk-cube sk-cube7"></div>
                <div class="sk-cube sk-cube8"></div>
                <div class="sk-cube sk-cube9"></div>
            </div>
            Merci de patienter, nous analysons votre article. Le temps de traitement peut varier
            de quelques dizaines de secondes à plusieurs minutes. Vous pouvez fermer cette popup et la rouvrir plus
            tard.
        </div>
        <div v-if="!loading">
            <div id="error-content" v-if="mainError.level">
                <h4>{{ getFriendlyLevelName(mainError.level) }}</h4>
                <p>{{ mainError.message }}</p>
                <p class="small">Merci de nous contacter via le lien ci-dessous si vous rencontrez une erreur
                    alors que vous pensiez obtenir un résultat.</p>
            </div>
            <div id="popup-content" v-if="!mainError.level && results.page.title">
                <div class="row">
                    <div class="col-12 text-center">
                        <h4>Niveau de confiance</h4>
                        <p>
                            <strong>Titre :</strong> {{ results.page.title }}
                        </p>
                        <span title="Très peu fiable" class="confidence-score-box score-box"
                              v-bind:class="colorClassFromScore(this.results.confidenceScore, 'bad')">1</span>
                        <span title="Peu fiable" class="confidence-score-box score-box"
                              v-bind:class="colorClassFromScore(this.results.confidenceScore, 'not-so-bad')">2</span>
                        <span title="Contenu incertain" class="confidence-score-box score-box"
                              v-bind:class="colorClassFromScore(this.results.confidenceScore, 'meh')">3</span>
                        <span title="Fiable" class="confidence-score-box score-box"
                              v-bind:class="colorClassFromScore(this.results.confidenceScore, 'not-so-good')">4</span>
                        <span title="Très fiable" class="confidence-score-box score-box"
                              v-bind:class="colorClassFromScore(this.results.confidenceScore, 'good')">5</span>
                    </div>
                </div>
                <hr>
                <div class="row">
                    <div class="col-12">
                        <h4>Articles connexes</h4>
                        <p>
                            {{ results.interestingRelatedArticlesCount }}
                            {{ pluralize("article", results.interestingRelatedArticlesCount) }} parmi ceux que nous avons
                            analysés
                            {{ pluralize("est", results.interestingRelatedArticlesCount, "sont", true) }}
                            {{ pluralize("similaire", results.interestingRelatedArticlesCount) }}
                            à votre article.
                            <span v-if="results.relatedArticles.length > 0 && results.relatedArticles.length < results.interestingRelatedArticlesCount">En voici {{ results.relatedArticles.length }} :</span>
                            <span v-if="results.relatedArticles.length > 0 && results.relatedArticles.length === results.interestingRelatedArticlesCount">Les voici :</span>
                        </p>
                        <ul class="list" v-if="results.relatedArticles.length > 0">
                            <li v-for="article in results.relatedArticles">
                                <a v-bind:href="article.url" target="_blank">
                                    {{ article.publisher }} - {{ article.title }}
                                </a>
                            </li>
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
                            <strong>{{ results.totalArticles }}</strong>
                            {{ pluralize("autre", results.totalArticles) }}
                            {{ pluralize("article", results.totalArticles) }}.<br>
                            Le score attribué <strong>au site</strong> a été calculé par l'analyse précédente de
                            <strong>{{ results.siteScoreArticlesCount - 1 }}</strong>
                            {{ pluralize("autre", results.siteScoreArticlesCount) }}
                            {{ pluralize("article", results.siteScoreArticlesCount) }}.<br>
                            Le score des <strong>articles isolés</strong> est calculé en fonction du nombre d'articles
                            isolés détectés pour le site.
                            <a href="https://github.com/CheckFake/api/wiki/Calcul-du-score"
                               target="_blank">Plus de détails sur la
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
                                <tr v-for="(score, key) in results.scores">
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
            <a href="https://goo.gl/forms/qN89r0tL8NRRDAG73" target="_blank">
                Nous aider
            </a>
            <a href="https://github.com/Crocmagnon/fake-news-detector/issues/new" target="_blank">
                Signaler un problème
            </a>
        </div>
    </div>
</template>
<script>
    export default {
        data() {
            return {
                results: {
                    page: {
                        title: null,
                        url: null
                    },
                    confidenceScore: null,
                    relatedArticles: [],
                    scores: [],
                    totalArticles: null,
                    siteScoreArticlesCount: null,
                    interestingRelatedArticlesCount: null,
                },
                mainError: {
                    level: null,
                    message: null
                },
                details: false,
                loading: true,
                fromLocalStorage: false,
            }
        },
        watch: {
            results: {
                handler() {
                    if (this.fromLocalStorage) {
                        return;
                    }

                    let contentToStore = {};
                    contentToStore[this.results.page.url] = JSON.stringify(this.results);
                    console.log("storing", contentToStore);
                    browser.storage.local.set(contentToStore);
                },
                deep: true
            }
        },
        methods: {
            getFriendlyLevelName(level) {
                switch (level) {
                    case "debug":
                    case "info":
                        return "Information";
                    case "warning":
                        return "Attention";
                    default:
                        return "Erreur";
                }
            },
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
                    case "isolated articles":
                        arr = "Articles isolés";
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
                let cls = this.colorClassFromScore(this.results.confidenceScore);
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
                if (!data) {
                    return;
                }
                this.loading = false;
                let tab = tabs[0];
                if (this.fromLocalStorage) {
                    this.results = data;
                }
                else {
                    this.results.page.title = tab.title;
                    this.results.page.url = tab.url;
                    this.results.confidenceScore = data.data.global_score;

                    this.results.scores = data.data.scores;
                    this.results.relatedArticles = data.data.related_articles_selection;
                    this.results.totalArticles = data.data.total_articles;
                    this.results.siteScoreArticlesCount = data.data.site_score_articles_count;
                    this.results.interestingRelatedArticlesCount = data.data.interesting_related_articles_count;
                }

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
            displayError(error) {
                this.loading = false;
                this.mainError.level = error.status;
                this.mainError.message = error.data.message;
                console.error(error);
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
                console.log("calling API");
                let url = encodeURIComponent(tabs[0].url);
                return fetch(`http://localhost:8000/api/page?url=${url}`);
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
            let dataFromLocalStoragePromise = activeTabPromise
                .then(tabs => {
                    let url = tabs[0].url;
                    return browser.storage.local.get(url)
                });

            let getScorePromise = Promise.all([activeTabPromise, dataFromLocalStoragePromise])
                .then(([tabs, data]) => {
                    if (data.hasOwnProperty(tabs[0].url)) {
                        console.log("got data from storage");
                        let d = JSON.parse(data[tabs[0].url]);
                        this.fromLocalStorage = true;
                        return d;
                    }
                    return queryAPI(tabs);
                })
                .then(response => {
                    if (this.fromLocalStorage) {
                        return response;
                    }
                    if (response.ok) {
                        return response.json();
                    }
                    throw {
                        status: "error",
                        data: {
                            message: "Erreur de l'API"
                        }
                    }
                })
                .then(data => {
                    if (this.fromLocalStorage) {
                        return data;
                    }
                    if (data.status !== 'success') {
                        throw data;
                    }
                    return data;
                })
                .catch(error => {
                    if (!error.status) {
                        error = {
                            status: "error",
                            data: {
                                message: error.message
                            }
                        }
                    }
                    this.displayError(error);
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
