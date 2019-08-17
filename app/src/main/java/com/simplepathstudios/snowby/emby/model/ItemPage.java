package com.simplepathstudios.snowby.emby.model;

import java.util.ArrayList;
import java.util.List;

public class ItemPage<T> {
    public ItemPage(){
        Items = new ArrayList<T>();
    }
    public List<T> Items;
    public int TotalRecordCount;
}
