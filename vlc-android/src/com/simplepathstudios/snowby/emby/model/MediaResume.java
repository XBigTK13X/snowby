package com.simplepathstudios.snowby.emby.model;

import android.util.Log;

import com.simplepathstudios.snowby.util.SnowbySettings;

import java.util.ArrayList;
import java.util.List;

public class MediaResume extends MediaPreview {
    public String Name;
    public String ServerId;
    public String SeriesName;
    public String SeasonName;
    public String SeriesId;
    public String SeasonId;
    public String Type;
    public long RunTimeTicks;
    public int ParentBackdropItemId;
    public List<String> ParentBackdropImageTags;
    public String MediaType;

    public MediaResume(){
        ParentBackdropImageTags = new ArrayList<String>();
    }

    @Override
    public String getTitle() {
        return SeriesName;
    }

    @Override
    public String getContent() {
        return Name;
    }
}
