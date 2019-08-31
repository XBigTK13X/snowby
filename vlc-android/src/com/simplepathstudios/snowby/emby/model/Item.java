package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.util.SnowbySettings;

import java.util.List;

public class Item extends MediaPreview {
    public String Name;
    public String Path;
    public String Overview;
    public String MediaType;
    public String ProductionYear;
    public List<String> Taglines;
    public String CollectionType;
    public List<MediaStream> MediaStreams;
    public String SeriesName;
    public String ParentId;
    public String SeasonName;
    public String IndexNumber;

    @Override
    public String getTitle() {
        if(Type.equals("Episode")){
            String result = SeasonName.replace("Season ","S") + "E"+IndexNumber;
            if(showSpoilers()){
               result += " - " + Name;
            }
            return result;
        }
        return Name;
    }

    @Override
    public String getContent() {
        if(UserData != null && UserData.UnplayedItemCount != null && UserData.UnplayedItemCount > 0){
            return UserData.UnplayedItemCount + " New Episodes";
        }
        //TODO This isn't actually working. Also, try to get episode season/ep# in the resume card
        if(UserData != null && UserData.PlayedPercentage != null && UserData.PlayedPercentage > 0){
            return Math.floor(UserData.PlayedPercentage) + "%";
        }
        return getFidelity();
    }

    public String getFidelity(){
        if(MediaStreams != null){
            String videoFidelity = "";
            String audioFidelity = "";
            for(MediaStream stream: MediaStreams){
                if(stream.Type.equals("Video") && (stream.IsDefault || videoFidelity.isEmpty()) ){
                    videoFidelity = stream.DisplayTitle;
                    if(!videoFidelity.toLowerCase().contains(stream.Codec.toLowerCase())){
                        videoFidelity += stream.Codec;
                    }
                }
                if(stream.Type.equals("Audio") && (stream.IsDefault || audioFidelity.isEmpty())){
                    audioFidelity = stream.DisplayTitle.replace("(Default)","");
                    if(stream.DisplayLanguage != null){
                        audioFidelity = audioFidelity.replace(stream.DisplayLanguage,"");
                    }
                    audioFidelity = audioFidelity.replace("Und","").replace("Undefined","");
                    if(!audioFidelity.toLowerCase().contains(stream.Codec.toLowerCase())){
                        audioFidelity += stream.Codec;
                    }
                    audioFidelity = audioFidelity.replace("Dolby Digital","DD");
                }
            }
            String contentType = "";
            if(Path != null){
                if(Path.contains("Remux")){
                    contentType = "RX ";
                } else{
                    contentType = "TC ";
                }

            }
            return contentType + videoFidelity.trim() + " " + audioFidelity.trim();
        }
        return "";
    }
}
