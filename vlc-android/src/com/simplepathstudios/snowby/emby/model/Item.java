package com.simplepathstudios.snowby.emby.model;

import com.simplepathstudios.snowby.util.SnowbySettings;

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
    public String SeriesName;
    public String ParentId;
    public String SeasonName;
    public String IndexNumber;

    @Override
    public String getTitle() {
        if(Type.equals("Episode")){
            return SeasonName.replace("Season ","S") + "E"+IndexNumber +" - "+ Name;
        }
        return Name;
    }

    @Override
    public String getContent() {
        return getFidelity();
    }

    @Override
    public String getPrimaryImageUrl(int width, int height) {
        return SnowbySettings.EMBY_SERVER_ADDRESS + "/emby/Items/"+Id+"/Images/Primary?maxHeight="+width+"&maxWidth="+height+"&tag="+ImageTags.get("Primary")+"&quality=100";
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
                    if(!audioFidelity.toLowerCase().contains(stream.Codec.toLowerCase())){
                        audioFidelity += stream.Codec;
                    }
                }
            }
            return "Video [" + videoFidelity.trim() + "] Audio [" + audioFidelity.trim() + "]";
        }
        return "";
    }
}
