export default class Storage {
    get(key) {
        var item = localStorage.getItem(key);

        if (item){            
            return (item === Object(item)) ? JSON.parse(item) : item;            
        }

        return null;        
    }

    set(key, val){
        try {
            if (val === Object(val)){
                localStorage.setItem(key, JSON.stringify(val));
            }
        else localStorage.setItem(key, val);
        } catch (e) {
            if (e == QUOTA_EXCEEDED_ERR) {
                console.log('quota exceed error');
            }
            else console.log(err);
        }
    }    

    remove(key){
        localStorage.removeItem(key);
    }

    clear(){
        localStorage.clear();
    }
}