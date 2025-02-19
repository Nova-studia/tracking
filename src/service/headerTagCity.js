

export function extractUniqueLotLocations(vehicles) {
    const state = new Set();
    state.add('Todos');
    vehicles.forEach(vehicle => {
        if (vehicle.state) {
            state.add(vehicle.state);
        }
    });
    // al inicio le ponemos un estado que tida todos
    return Array.from(state);
}

export const ListState = async ()=>{
    const response = await fetch(`http://localhost:5000/api/states`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
    });
    const data = await response.json();
    return data;
}

const idKeyObj = (obj, key) => {
    return  key in obj;
}

export const FilterDriversSelect = (drivers, states) => {
    try {
        console.log('states:', states);
        states = states.toLowerCase()
        if (states === "" || states.length === 0) {
            return drivers;
        }
    
    
        if (Array.isArray(drivers) && drivers.length > 0) {
            const dri = drivers.filter(driver => {
                if(idKeyObj(driver, 'state')){
                    return driver.state.toLowerCase() === states;
                }
            });
            if(dri.length === 0){
                return drivers;
            }else{
                return dri;
            }
        }
        return drivers;
    } catch (error) {
        console.log('error:', error);        
    }
}
