function viewModel(){
    // Data AND map stuff
    var self = this;
    // center of my map
    var myLatlng = new google.maps.LatLng(36.673782, -121.654955);
    // options for my map
    var mapOptions = {
        zoom: 15,
        center: myLatlng,
    };
    // initalize the map
    var map = new google.maps.Map(document.getElementById('map'), mapOptions);
    // had to declare this outside the insatREsult in order for the info windows
    // to close in the google maps.
    var infowindow;

    // this is the core object that is made from the AJAX data. It goes to the results array
    InstaResult = function(picThumb, tag1, lat, longi, picUrl, fullcap, user, index){
        // thumbnail pic for list
        this.picThumb = picThumb;
        // fist tag displayed in list
        this.tag1 = tag1;
        // main insta pic
        this.picUrl = picUrl;
        // lat and long
        this.ll = new google.maps.LatLng(lat, longi);
        // caption displayed in modal
        this.cap = fullcap;
        // instagram user
        this.user = user;
        this.index = index;
        // observable for search bar functionality
        this.isVisible = ko.observable(true);
        // content for g.maps infor window
        var contentString =
            '<div>' +
            '<h5 class="media-heading">' + '@'+ user + '</h5>'+
            '<input type="image" data-toggle="modal" data-target=".big_target' + index + '" src="' + picThumb + '"/>' +
            fullcap + '</div>';
        // marker for g.maps
        this.marker = new google.maps.Marker({
            position: this.ll,
            map: map,
        });

        // init infowindow from g.map
        google.maps.event.addListener(this.marker, 'click', function(){
            if(infowindow){
                infowindow.close();
            }
            infowindow = new google.maps.InfoWindow({
                content: contentString,
                maxWidth: 140,
                position: this.ll
            });
            infowindow.open(map, this.marker);
        }.bind(this));
        // init infowindow from list
        this.openInfoWindow = function(){
            if(infowindow){
                infowindow.close();
            }
            infowindow = new google.maps.InfoWindow({
                content: contentString,
                maxWidth: 140,
                position: this.ll
            });
            infowindow.open(map, this.marker);
        };
        // modal for when user clicks on thump pic
        var modal =
            '<div class="modal fade big_target' + index + '" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel">' +
            '<div class="modal-dialog">' + '<div class="modal-content">' + '<div class="modal-body">' +
            '<img class="img-responsive modalimg" src="' + picUrl + '">' + '<h3 class="media-heading">' + '@' + user + '</h3>' + fullcap +
            '</div>' + '</div>' + '</div>' + '</div>';

        $('.' + index).append(modal);

        this.marker.setMap(map);
    };

    // results displayed in view bar.  When added, InstaResults go here
    self.results = ko.observableArray([]);
    
    // ============= Filter Operations ===============

    // observable term imputed from search bar
    self.query = ko.observable('');
    // compares search term with tag listed in results
    function compare (search, inStr) {
        var lengthSearch = search.length;
        var lengthInStr = inStr.length;
        var found;
        for (var i = 0; i < lengthSearch; i++) {
            for (var j = 0; j < lengthInStr; j++) {
                found = false;
                if (search[i].toLowerCase() === inStr[j].toLowerCase()) {
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }
        return true;
    }
    // uses compare function to make insta results visible or not in list
    self.query.subscribe(function(term){
        var length = self.results().length;
        var t;
        if(infowindow === undefined){
            for( var i = 0; i < length; i++){
                t = self.results()[i];
                t.isVisible(compare(term, t.tag1));
                t.marker.setVisible(t.isVisible());
            }
        }else{
            for( var s = 0; s < length; s++){
                t = self.results()[s];
                t.isVisible(compare(term, t.tag1));
                t.marker.setVisible(t.isVisible());
                if(!compare(term, t.tag1)){
                    infowindow.close();
                }
            }
        }
    });

    // ============= Ajax related operations  ================

    // add insta object to results array
    self.addResult = function(thumb, tag1, lat, longi, picUrl, fullcap, user, index){
        self.results.push(new InstaResult(thumb, tag1, lat, longi, picUrl, fullcap, user, index));
    };
    // grabs token from DOM after user signs into insta
    this.token = "";
    function tokenGrab(){
        var hash = window.location.hash.substr(1);
        var arHash = hash.split('=');
        this.token =  arHash[1];
        console.log(this.token);
    }
    tokenGrab();
    // drops intro modal if token is undefined
    if(token === undefined){
        $('.intro').modal('show');
    }
    // ajax call function
    function getInstaData(){
        // sometimes users will not have any tags for their picture.  This function checks if there
        // are any tags in the array.  If none, then "salinas" is added to tag1 in the InstaResult  
        function tagCheck(tags, tag1){
            if(tags.length === 0){
                return "salinas";
            }else{
                return tag1;
            }
        }
        $.ajax({
            type: 'GET',
            dataType: 'jsonp',
            cache: false,
            url: "https://api.instagram.com/v1/media/search?lat=36.673782&lng=-121.654955&distance=5km&access_token=" + this.token,
            success: function(response){
                console.log(response);
                // creats 9 new instaresults for results array from ajax data
                for(var i =0; i < 9; i++){
                    // checks caption
                    var caption;
                    if(response.data[i].caption !== null){
                        caption = response.data[i].caption.text;
                    }else{
                        caption = "";
                    }
                    // New Insta object is created 
                    self.addResult(
                        response.data[i].images.thumbnail.url,
                        tagCheck(response.data[i].tags, response.data[i].tags[0]),
                        response.data[i].location.latitude,
                        response.data[i].location.longitude,
                        response.data[i].images.standard_resolution.url,
                        caption,
                        response.data[i].user.username,
                        i
                    );
                }
            },
            error: function(data){
                console.log(data);
            }
        });
    }
    getInstaData();
}

ko.applyBindings(viewModel);









 