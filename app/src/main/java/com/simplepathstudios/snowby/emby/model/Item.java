package com.simplepathstudios.snowby.emby.model;

import java.util.List;

public class Item extends MediaPreview {
    public String Name;
    public String Id;
    public String Type;
    public String Path;
    public String Overview;
    public String MediaType;
    public String ProductionYear;
    public List<String> Taglines;
    public String CollectionType;
    public List<MediaStream> MediaStreams;

    @Override
    public String getTitle() {
        return Name;
    }

    @Override
    public String getContent() {
        return getFidelity();
    }

    @Override
    public String getPrimaryImageUrl() {
        return "http://9914.us:8096/emby/Items/"+Id+"/Images/Primary?maxHeight=100&maxWidth=200&tag="+ImageTags.get("Primary")+"&quality=100";
    }

    @Override
    public Integer getWidth() {
        return 400;
    }

    @Override
    public Integer getHeight() {
        return 300;
    }

    public String getDescription(){
        return Overview;
    }

    public String getMediaPath(){
        return Path;
    }

    public String getFidelity(){
        if(MediaStreams != null){
            String videoFidelity = "";
            String audioFidelity = "";
            for(MediaStream stream: MediaStreams){
                if(stream.Type.equals("Video") && (stream.IsDefault || videoFidelity.isEmpty()) ){
                    videoFidelity = stream.DisplayTitle;
                }
                if(stream.Type.equals("Audio") && (stream.IsDefault || audioFidelity.isEmpty())){
                    audioFidelity = stream.DisplayTitle.replace("(Default)","");
                }
            }
            return videoFidelity + " + " + audioFidelity;
        }
        return "";
    }
}
