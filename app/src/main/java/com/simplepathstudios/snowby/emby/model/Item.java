package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.util.SnowbyConstants;

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
    public String SeriesId;
    public String SeasonId;

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
        return SnowbyConstants.EMBY_SERVER_ADDRESS + "/emby/Items/"+Id+"/Images/Primary?maxHeight="+SnowbyConstants.OVERVIEW_CARD_HEIGHT+"&maxWidth="+SnowbyConstants.OVERVIEW_CARD_WIDTH+"&tag="+ImageTags.get("Primary")+"&quality=100";
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
                    audioFidelity = stream.DisplayTitle.replace("(Default)","").replace(stream.DisplayLanguage+ " ","");
                }
            }
            return "Video [" + videoFidelity + "] Audio [" + audioFidelity+"]";
        }
        return "";
    }
}
