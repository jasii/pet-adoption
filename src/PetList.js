import React from 'react';
import PetAdoption from './PetAdoption';

function PetList({ pets, adoptedPets, setShowForm }) {
  return (
    <div>
      {pets.map((pet, index) => (
        <PetAdoption
          key={pet.name}
          pet={pet}
          adoptedPets={adoptedPets}
          setShowForm={setShowForm}
          index={index}
        />
      ))}
    </div>
  );
}

export default PetList;