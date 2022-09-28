const clientID = "e949f0cece49480f9a3966705e1b5983";
const redirectUri = "http://localhost:3000/";
let accessToken;

const Spotify={
    getAccessToken(){
        if(accessToken){
            return accessToken;
        }

        const accessTokenMatch = window.location.href.match(/access_token=([^&]*)/);
        const expiresInMatch = window.location.href.match(/expires_in=([^&]*)/);

        if(accessTokenMatch && expiresInMatch){
            accessToken = accessTokenMatch[1];
            const expiresIn=Number(expiresInMatch[1]);

            window.setTimeout(()=> (accessToken=''), expiresIn * 1000);
            window.history.pushState("Access Token", null, "/");

            return accessToken;
        }else{
            const accessUrl=`https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUri}`;
            window.location=accessUrl;
        }
    },
    async search(term){
        const accToken = Spotify.getAccessToken();
        const url =  `https://api.spotify.com/v1/search?type=track&q=${term}`
        
        try {
            const response = await fetch(url, {headers: {Authorization: `Bearer ${accToken}`}});
            if (response.ok) {
                const jsonResponse = await response.json();
                if (!jsonResponse.tracks) {
                    return [];
                }
                return jsonResponse.tracks.items.map(track => ({
                    id: track.id,
                    name: track.name,
                    artist: track.artists[0].name,
                    album: track.album.name,
                    uri: track.uri
                }));
            }
        } catch(error) {
            console.log(error)
        }
        
    },

    savePlaylist(name, trackUris){
        if(!name || !trackUris.length){
            return;
        }
        const accessToken = Spotify.getAccessToken();
        const headers={Authorization: `Bearer ${accessToken}`};
        let userID;
        
        return fetch("https://api.spotify.com/v1/me", {headers: headers})
        .then(response => response.json())
        .then(jsonResponse=> {
            userID=jsonResponse.id;
            return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
                headers: headers,
                method: "POST",
                body: JSON.stringify({name:name})
            })
            .then(response => response.json())
            .then(jsonResponse => {
                const playlistID = jsonResponse.id;
                return fetch(
                    `https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`,
                    {
                        headers: headers,
                        method: "POST",
                        body: JSON.stringify({uris: trackUris})

                    }
                );
            });
        });
    }
};

export default Spotify;