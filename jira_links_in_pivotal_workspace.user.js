// ==UserScript==
// @name         jira_links_in_pivotal_workspace
// @namespace    http://sensale.net/
// @version      0.1
// @description  For Stories linked back to Jira, this will add a direct link to the Jira on the dashboard.
//               This should make it easier to link back to Jira, or compare for prioritization.
// @author       Brian Sensale
// @match        https://www.pivotaltracker.com/n/projects/*
// @grant        none
// ==/UserScript==
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js

// *************************************************
// Fetch the project url.
// *************************************************
projectId = location.pathname.match(/\d{4,}/g)[0];
pivotalProjectUrl = "https://www.pivotaltracker.com/services/v5/projects/" +
          projectId;

// *************************************************
// Fetch the Jira base URL
// *************************************************
jiraBase = null;
$.ajax({
    url: pivotalProjectUrl + "/integrations",
    async: false,
    dataType: 'json',
    success: function(data) {
        jiraBase = data[0].base_url;
    }
});
if(jiraBase.charAt(jiraBase.length-1) != '/')
    jiraBase += "/";

jiraBase += "browse/";

// *************************************************
// Grabs the external_id from the Pivotal API
// *************************************************
function getExternalId(story) {
    $.ajax({
        url: pivotalProjectUrl + "/stories/" + story.getAttribute('data-id'),
        async: false,
        dataType: 'json',
        success: function(data) {
            id = data.external_id;
            if(id !== null) {
                jiraUrl = jiraBase + id;
                jiraSpanHtml = '<span class="parens jiraurl_injected">' +
                               '<a href="' + jiraUrl + '" target="_blank">' + id + '</a></span>';
                injectionLocation = $(story).find('span[class="post labels"]');
                console.log("Inserting span: " + jiraSpanHtml);	
                $(jiraSpanHtml).insertBefore(injectionLocation);
            }
        }
    });
}

// *************************************************
// Add links to objects that need them
// *************************************************
function addLinks() {
    // If we haven't loaded yet, try again in a second, and return.
    mainProject = $('section[class="main project"]');
    if(mainProject == null || mainProject.size() == 0) {
        console.log("Tried to add links to an empty window.  Sleep and try again.");
        setTimeout(addLinks, 1000);
    }
    //Get all the story divs with a jira integration
    stories = $("div[class*='story'][class*='jira_integration']");

    //Add a link to the Jira to the end of each story name if its needed
    $.each(stories, 
        function(index, value) {
            injectedSpan = $(value).find('span[class="parens jiraurl_injected"]');
            if(injectedSpan.size() > 0) {
                console.log("Skipping story that already has an injection");
                return;
            }
            getExternalId(value);
        });
}

// *************************************************
// Set up a loop to do it
// *************************************************
addLinks();
setInterval(addLinks, 60000);
$('body').click(function(){
    setTimeout(addLinks, 1000);
});
