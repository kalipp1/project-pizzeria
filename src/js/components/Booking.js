import {classNames, select, settings, templates,} from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
class Booking {
    constructor(element){
        const thisBooking = this;
        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    getData(){
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);  

        const params = {
            bookings: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

        // console.log('params: ', params);

        const urls = {
            bookings: settings.db.url + '/' + settings.db.bookings
                + '?' + params.bookings.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events
                + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.events 
                + '?' + params.eventsRepeat.join('&'),
        };
        // console.log('urls: ', urls);

        Promise.all([
            fetch(urls.bookings),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
        ])
            .then(function(allResponses){
                const bookingsResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];

                // console.log('Bookings Response:', bookingsResponse);
                // console.log('Events Current Response:', eventsCurrentResponse);
                // console.log('Events Repeat Response:', eventsRepeatResponse);
                
                return Promise.all([
                    bookingsResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json(),
                ]);
            })
            .then(function([bookings, eventsCurrent, eventsRepeat]){
                // console.log(bookings);
                // console.log(eventsCurrent);
                // console.log(eventsRepeat);
                thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
            })
    }
    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;

        thisBooking.booked = {};
        for(let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for(let item of eventsRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
                thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }

        console.log('thisBooking.booked ', thisBooking.booked);

        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        if(typeof thisBooking.booked[date]== 'undefined'){
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);

        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock+=0.5){
            // console.log('loop', hourBlock);
            if(typeof thisBooking.booked[date][hourBlock]== 'undefined'){
                thisBooking.booked[date][hourBlock] = [];
            }
    
            thisBooking.booked[date][hourBlock].push(table);
        }
    }

    updateDOM(){
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if(
            typeof thisBooking.booked[thisBooking.date] == 'undefined'
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ){
            allAvailable = true;
        }

        for(let table of thisBooking.dom.tables){
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if(!isNaN(tableId)){
                tableId = parseInt(tableId);
            }

            if(
                !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId) > -1
            ){
                table.classList.add(classNames.booking.tableBooked);
            }else{
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }

    render(element){
        const thisBooking = this;
        const generatedHTML = templates.bookingWidget();
        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        thisBooking.dom.peopleAmount = document.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = document.querySelector(select.booking.hoursAmount);
        thisBooking.dom.date = document.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hours = document.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = document.querySelectorAll(select.booking.tables);
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector('[name="phone"]');
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector('[name="address"]');
        thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll('[name="starter"]');
        thisBooking.dom.form = document.querySelector(select.booking.form);
    }
    initWidgets(){
        const thisBooking = this;
        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.dom.peopleAmount.addEventListener('updated', function(){
            
          });
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.dom.hoursAmount.addEventListener('updated', function(){
            
        });
        
        thisBooking.datePicker = new DatePicker(thisBooking.dom.date);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hours);
        thisBooking.dom.hours.addEventListener('updated', function(){
            for(let table of thisBooking.dom.tables){
                table.classList.remove(classNames.booking.tablePicked);
            }
        });

        thisBooking.dom.wrapper.addEventListener('updated', function(){
            thisBooking.updateDOM();
        });

        thisBooking.dom.wrapper.addEventListener('click', function(event){
            // event.preventDefault();

            const clickedElement = event.target;
            if(clickedElement.classList.contains('table')){
                for(let table of thisBooking.dom.tables){
                    if(table.dataset.table !== clickedElement.dataset.table){
                    table.classList.remove(classNames.booking.tablePicked);
                    }
                }

                if(!clickedElement.classList.contains(classNames.booking.tableBooked)){
                    clickedElement.classList.toggle(classNames.booking.tablePicked);
                }
                // else if(table.classList.contains(classNames.booking.tablePicked)){
                //     clickedElement.classList.remove(classNames.booking.tableBooked);
                // }
            }
        });

        thisBooking.dom.form.addEventListener('submit', function(event){
            console.log('123');
            event.preventDefault();
            thisBooking.sendOrder();
        });
    }
    sendOrder(){
        const thisBooking = this;
        const url = settings.db.url + '/' + settings.db.bookings;
        console.log(url);
        const payload = {
          date: thisBooking.datePicker.value,
          hour: thisBooking.hourPicker.value,
          table: parseInt(thisBooking.dom.wrapper.querySelector('.picked').dataset.table),
          duration: thisBooking.hoursAmount.value,
          ppl: thisBooking.peopleAmount.value,
          starters: [],
          phone: thisBooking.dom.phone.value,
          address: thisBooking.dom.address.value,
        };
        for(let checkbox of thisBooking.dom.starters){
            if(checkbox.checked){
                payload.starters.push(checkbox.value);
            }
        }
        console.log(payload);
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };
        
        fetch(url, options);
      }
    }

export default Booking;